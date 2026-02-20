import { NextResponse } from 'next/server';

// Standing Intent is now managed by Kite Passport via MCP/OAuth.
// This endpoint is kept for backward compatibility but returns
// information about the Kite Passport session management.

export async function GET() {
  return NextResponse.json({
    message:
      'Session management is handled by Kite Agent Passport. Configure your MCP connection at https://neo.dev.gokite.ai/v1/mcp',
    kitePortal: 'https://x402-portal-eight.vercel.app/',
    mcpUrl: 'https://neo.dev.gokite.ai/v1/mcp',
    docs: 'https://docs.gokite.ai/kite-agent-passport/developer-guide',
  });
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        'Standing Intent configuration has been replaced by Kite Agent Passport sessions. Please use the Kite Portal to manage spending rules.',
      kitePortal: 'https://x402-portal-eight.vercel.app/',
    },
    { status: 410 } // Gone — resource no longer available
  );
}
