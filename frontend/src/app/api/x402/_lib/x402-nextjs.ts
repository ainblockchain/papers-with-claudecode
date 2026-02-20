// Next.js App Router adapter for Kite x402 payment gating
// Implements gokite-aa scheme with Pieverse facilitator

import { NextRequest, NextResponse } from 'next/server';
import {
  getChainConfig,
  KITE_TEST_USDT_ADDRESS,
  PIEVERSE_FACILITATOR_URL,
  MERCHANT_WALLET_ADDRESS,
} from '@/lib/kite/contracts';

// Payment requirement configuration for a route
export interface X402RouteConfig {
  /** Payment amount in wei (string) */
  maxAmountRequired: string;
  /** Human-readable service description */
  description: string;
  /** API resource URL */
  resource: string;
  /** Service wallet address to receive payment */
  payTo: string;
  /** Service display name */
  merchantName: string;
  /** API output schema for AI agent discovery */
  outputSchema?: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
}

/** Decoded X-PAYMENT token */
interface DecodedPayment {
  authorization: Record<string, unknown>;
  signature: string;
}

/**
 * Build a 402 Payment Required response body per Kite x402 spec.
 */
function build402Response(config: X402RouteConfig, network: string): object {
  return {
    error: 'X-PAYMENT header is required',
    accepts: [
      {
        scheme: 'gokite-aa',
        network,
        maxAmountRequired: config.maxAmountRequired,
        resource: config.resource,
        description: config.description,
        mimeType: 'application/json',
        outputSchema: config.outputSchema || null,
        payTo: config.payTo,
        maxTimeoutSeconds: 300,
        asset: KITE_TEST_USDT_ADDRESS,
        extra: null,
        merchantName: config.merchantName,
      },
    ],
    x402Version: 1,
  };
}

/**
 * Decode the X-PAYMENT header (base64-encoded JSON).
 */
function decodePaymentToken(token: string): DecodedPayment | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.authorization && decoded.signature) {
      return decoded as DecodedPayment;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify payment via Pieverse facilitator.
 */
async function verifyPayment(
  payment: DecodedPayment,
  network: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${PIEVERSE_FACILITATOR_URL}/v2/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorization: payment.authorization,
        signature: payment.signature,
        network,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: body.error || `Verification failed (${res.status})`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Verification request failed',
    };
  }
}

/**
 * Settle payment via Pieverse facilitator (executes on-chain transfer).
 */
async function settlePayment(
  payment: DecodedPayment,
  network: string
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const res = await fetch(`${PIEVERSE_FACILITATOR_URL}/v2/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorization: payment.authorization,
        signature: payment.signature,
        network,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: body.error || `Settlement failed (${res.status})`,
      };
    }
    return { ok: true, data: body };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Settlement request failed',
    };
  }
}

/**
 * Wraps a Next.js route handler with Kite x402 payment gating.
 *
 * Flow:
 * 1. If no X-PAYMENT header → return 402 with payment requirements
 * 2. If X-PAYMENT present → decode, verify, settle, then call handler
 */
export async function withX402Payment(
  req: NextRequest,
  routeConfig: X402RouteConfig,
  handler: (req: NextRequest, bodyText: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const chainConfig = getChainConfig();
  const network = chainConfig.network;

  // Read body once for potential re-use
  const bodyText = await req.text().catch(() => '');

  // Check for X-PAYMENT header (case-insensitive)
  const paymentToken =
    req.headers.get('x-payment') ||
    req.headers.get('X-PAYMENT') ||
    req.headers.get('X-Payment');

  // No payment token → return 402
  if (!paymentToken) {
    return NextResponse.json(build402Response(routeConfig, network), {
      status: 402,
    });
  }

  // Decode the payment token
  const decoded = decodePaymentToken(paymentToken);
  if (!decoded) {
    return NextResponse.json(
      { error: 'invalid_payment', message: 'Invalid X-PAYMENT token format' },
      { status: 400 }
    );
  }

  // Verify payment via Pieverse facilitator
  const verifyResult = await verifyPayment(decoded, network);
  if (!verifyResult.ok) {
    return NextResponse.json(
      {
        error: 'payment_verification_failed',
        message: verifyResult.error || 'Payment verification failed',
      },
      { status: 402 }
    );
  }

  // Settle payment via Pieverse facilitator
  const settleResult = await settlePayment(decoded, network);
  if (!settleResult.ok) {
    return NextResponse.json(
      {
        error: 'settlement_failed',
        message: settleResult.error || 'Payment settlement failed',
      },
      { status: 500 }
    );
  }

  // Payment confirmed — execute the handler
  const response = await handler(req, bodyText);

  // Add settlement info header
  if (settleResult.data) {
    const headers = new Headers(response.headers);
    headers.set('X-Payment-Settlement', JSON.stringify(settleResult.data));
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers,
    });
  }

  return response;
}

/**
 * Helper to build the default route config from environment variables.
 */
export function buildRouteConfig(
  overrides?: Partial<X402RouteConfig>
): X402RouteConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    maxAmountRequired: process.env.KITE_X402_PRICE || '1000000000000000000', // 1 USDT in wei
    description: 'Papers LMS Learning Service',
    resource: `${baseUrl}/api/x402/unlock-stage`,
    payTo: MERCHANT_WALLET_ADDRESS,
    merchantName: process.env.KITE_MERCHANT_NAME || 'Papers LMS',
    ...overrides,
  };
}
