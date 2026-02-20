import { NextRequest, NextResponse } from 'next/server';
import { startOAuthFlow } from '@/lib/kite/passport-auth';

const KITE_CLIENT_ID = process.env.KITE_OAUTH_CLIENT_ID || '';

/**
 * GET /api/kite-mcp/oauth — Start OAuth flow for Kite Passport
 */
export async function GET(req: NextRequest) {
  if (!KITE_CLIENT_ID) {
    return NextResponse.json(
      {
        error: 'not_configured',
        message: 'KITE_OAUTH_CLIENT_ID is not set. Configure OAuth credentials first.',
      },
      { status: 500 }
    );
  }

  const origin = req.headers.get('origin') || req.nextUrl.origin;
  const redirectUri = `${origin}/api/kite-mcp/oauth/callback`;

  const { authorizationUrl, state } = startOAuthFlow({
    clientId: KITE_CLIENT_ID,
    redirectUri,
  });

  const response = NextResponse.json({
    authorizationUrl,
    redirectUri,
  });
  response.cookies.set('kite_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
