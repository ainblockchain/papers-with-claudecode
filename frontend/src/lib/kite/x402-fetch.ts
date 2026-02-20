// x402-aware fetch wrapper for Kite Agent Passport
// Automatically handles HTTP 402 -> MCP payment -> retry flow

import { getKiteMcpClient, KiteMcpError } from './mcp-client';

export interface X402FetchOptions extends RequestInit {
  skipPayment?: boolean;
  tokenType?: string;
  merchantName?: string;
}

function extractPaymentInfo(body: Record<string, unknown>) {
  const accepts = body.accepts as Array<Record<string, string>> | undefined;
  if (accepts?.length) {
    const a = accepts[0];
    return {
      payTo: a.payTo || '',
      maxAmountRequired: a.maxAmountRequired || '0',
      asset: a.asset || 'USDT',
      network: a.network || 'kite-testnet',
      scheme: a.scheme || 'gokite-aa',
    };
  }
  return {
    payTo: (body.payee_addr || body.payTo || '') as string,
    maxAmountRequired: (body.amount || body.maxAmountRequired || '0') as string,
    asset: (body.token_type || body.asset || 'USDT') as string,
    network: (body.network || 'kite-testnet') as string,
    scheme: (body.scheme || 'gokite-aa') as string,
  };
}

export async function x402Fetch(url: string | URL, options?: X402FetchOptions): Promise<Response> {
  const { skipPayment, tokenType, merchantName, ...fetchInit } = options || {};
  const urlStr = url.toString();

  let response = await fetch(urlStr, fetchInit);

  if (response.status !== 402 || skipPayment) return response;

  const body = await response.json().catch(() => ({}));
  const paymentInfo = extractPaymentInfo(body as Record<string, unknown>);

  if (!paymentInfo.payTo) {
    throw new KiteMcpError('invalid_402', '402 response missing payTo.');
  }

  const mcpClient = getKiteMcpClient();
  if (!mcpClient.connected) {
    throw new KiteMcpError('not_connected', 'Kite MCP not connected. Configure Kite Passport first.');
  }

  const payerAddr = await mcpClient.getPayerAddr();

  const xPayment = await mcpClient.approvePayment({
    payer_addr: payerAddr,
    payee_addr: paymentInfo.payTo,
    amount: paymentInfo.maxAmountRequired,
    token_type: tokenType || paymentInfo.asset,
    merchant_name: merchantName,
  });

  const retryHeaders = new Headers(fetchInit.headers);
  retryHeaders.set('X-Payment', xPayment);

  response = await fetch(urlStr, { ...fetchInit, headers: retryHeaders });
  return response;
}

export function isX402Ready(): boolean {
  try {
    return getKiteMcpClient().connected;
  } catch {
    return false;
  }
}
