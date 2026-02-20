import { NextRequest, NextResponse } from 'next/server';
import { getKiteMcpClient, KiteMcpError } from '@/lib/kite/mcp-client';
import { ensureMcpConnected, disconnectPassport, getPassportStatus } from '@/lib/kite/passport-auth';

/**
 * GET /api/kite-mcp/config — Get current MCP configuration status
 */
export async function GET() {
  const status = getPassportStatus();
  const mcpClient = getKiteMcpClient();

  return NextResponse.json({
    connected: status.connected,
    authMode: status.mode,
    agentId: status.agentId || null,
    mcpUrl: mcpClient.currentConfig?.mcpUrl || process.env.KITE_MCP_URL || 'https://neo.dev.gokite.ai/v1/mcp',
    agentSelfAuthAvailable: !!(process.env.KITE_AGENT_ID && process.env.KITE_AGENT_SECRET),
  });
}

/**
 * POST /api/kite-mcp/config — Connect or reconnect MCP client
 * Body: { action: 'connect' | 'disconnect' | 'auto', accessToken?: string, agentId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action: string;
      accessToken?: string;
      agentId?: string;
    };

    if (body.action === 'disconnect') {
      await disconnectPassport();
      return NextResponse.json({ success: true, connected: false });
    }

    if (body.action === 'connect' && body.accessToken) {
      const mcpClient = getKiteMcpClient();
      await mcpClient.connect({
        mcpUrl: process.env.KITE_MCP_URL || 'https://neo.dev.gokite.ai/v1/mcp',
        accessToken: body.accessToken,
        agentId: body.agentId,
      });
      return NextResponse.json({ success: true, connected: true });
    }

    // Auto mode: try cached tokens -> agent self-auth -> fail
    await ensureMcpConnected();
    const status = getPassportStatus();
    return NextResponse.json({
      success: true,
      connected: true,
      authMode: status.mode,
      agentId: status.agentId,
    });
  } catch (err) {
    if (err instanceof KiteMcpError) {
      return NextResponse.json(
        { error: err.code, message: err.message, connected: false },
        { status: err.code === 'auth_required' ? 401 : 500 }
      );
    }
    return NextResponse.json(
      { error: 'internal', message: 'Failed to configure MCP client' },
      { status: 500 }
    );
  }
}
