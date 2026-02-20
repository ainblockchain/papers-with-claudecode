import { NextResponse } from 'next/server';
import { getPassportStatus } from '@/lib/kite/passport-auth';
import { getKiteMcpClient } from '@/lib/kite/mcp-client';

export async function GET() {
  const status = getPassportStatus();
  const mcpClient = getKiteMcpClient();

  let tools: Array<{ name: string; description?: string }> = [];
  if (mcpClient.connected) {
    try {
      tools = await mcpClient.listTools();
    } catch {
      // Tools listing may fail if session is stale
    }
  }

  return NextResponse.json({
    connected: status.connected,
    authMode: status.mode,
    agentId: status.agentId || null,
    expiresAt: status.expiresAt || null,
    availableTools: tools,
    mcpUrl: process.env.KITE_MCP_URL || 'https://neo.dev.gokite.ai/v1/mcp',
  });
}
