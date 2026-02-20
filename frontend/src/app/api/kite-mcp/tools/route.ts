import { NextRequest, NextResponse } from 'next/server';
import { getKiteMcpClient, KiteMcpError } from '@/lib/kite/mcp-client';
import { ensureMcpConnected } from '@/lib/kite/passport-auth';

/**
 * POST /api/kite-mcp/tools — Call a Kite MCP tool
 * Proxy for browser-side code to invoke MCP tools securely.
 * Body: { tool: 'get_payer_addr' | 'approve_payment', params: {} }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureMcpConnected();

    const body = (await req.json()) as {
      tool: string;
      params: Record<string, string>;
    };
    const mcpClient = getKiteMcpClient();

    if (body.tool === 'get_payer_addr') {
      const payerAddr = await mcpClient.getPayerAddr();
      return NextResponse.json({ payer_addr: payerAddr });
    }

    if (body.tool === 'approve_payment') {
      const xPayment = await mcpClient.approvePayment({
        payer_addr: body.params.payer_addr,
        payee_addr: body.params.payee_addr,
        amount: body.params.amount,
        token_type: body.params.token_type || 'USDT',
        merchant_name: body.params.merchant_name,
      });
      return NextResponse.json({ x_payment: xPayment });
    }

    return NextResponse.json(
      { error: 'unknown_tool', message: `Unknown tool: ${body.tool}` },
      { status: 400 }
    );
  } catch (err) {
    if (err instanceof KiteMcpError) {
      const status =
        err.code === 'auth_required' || err.code === 'Unauthorized'
          ? 401
          : err.code === 'SessionExpired'
          ? 401
          : err.code === 'InsufficientBudget'
          ? 402
          : 500;
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status }
      );
    }
    return NextResponse.json(
      { error: 'internal', message: 'MCP tool call failed' },
      { status: 500 }
    );
  }
}
