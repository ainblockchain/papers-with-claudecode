import { NextRequest, NextResponse } from 'next/server';
import { exchangeOAuthCode, connectWithToken } from '@/lib/kite/passport-auth';

const KITE_CLIENT_ID = process.env.KITE_OAUTH_CLIENT_ID || '';
const KITE_CLIENT_SECRET = process.env.KITE_OAUTH_CLIENT_SECRET;

/**
 * GET /api/kite-mcp/oauth/callback — OAuth callback after user authorization
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    const desc = req.nextUrl.searchParams.get('error_description') || error;
    return redirectWithStatus(req, 'error', desc);
  }

  if (!code) {
    return redirectWithStatus(req, 'error', 'Missing authorization code');
  }

  const savedState = req.cookies.get('kite_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return redirectWithStatus(req, 'error', 'Invalid OAuth state. Possible CSRF attack.');
  }

  try {
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const redirectUri = `${origin}/api/kite-mcp/oauth/callback`;

    const { accessToken } = await exchangeOAuthCode({
      code,
      clientId: KITE_CLIENT_ID,
      clientSecret: KITE_CLIENT_SECRET,
      redirectUri,
    });

    await connectWithToken(accessToken);

    const response = redirectWithStatus(req, 'success', 'Kite Passport connected');
    response.cookies.delete('kite_oauth_state');
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token exchange failed';
    return redirectWithStatus(req, 'error', message);
  }
}

function redirectWithStatus(
  req: NextRequest,
  status: 'success' | 'error',
  message: string
): NextResponse {
  const origin = req.nextUrl.origin;
  const redirectUrl = new URL('/agent-dashboard', origin);
  redirectUrl.searchParams.set('kite_oauth', status);
  redirectUrl.searchParams.set('kite_msg', message);
  return NextResponse.redirect(redirectUrl);
}
