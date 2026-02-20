// Kite Agent Passport — Authentication
// Two modes: User OAuth (Mode 1) and Agent Self-Auth

import { getKiteMcpClient, KiteMcpConfig, KiteMcpError } from './mcp-client';

const KITE_OAUTH_BASE =
  process.env.KITE_OAUTH_BASE_URL || 'https://neo.dev.gokite.ai';
const KITE_MCP_URL =
  process.env.KITE_MCP_URL || 'https://neo.dev.gokite.ai/v1/mcp';

// In-memory token cache
interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  agentId?: string;
  mode: 'user_oauth' | 'agent_self_auth';
}

let _tokenCache: StoredTokens | null = null;

function getStoredTokens(): StoredTokens | null {
  if (!_tokenCache) return null;
  if (_tokenCache.expiresAt < Date.now() + 60_000) return null;
  return _tokenCache;
}

function storeTokens(tokens: StoredTokens): void {
  _tokenCache = tokens;
}

function clearTokens(): void {
  _tokenCache = null;
}

// --- User OAuth Flow ---

export interface OAuthStartResult {
  authorizationUrl: string;
  state: string;
}

export function startOAuthFlow(params: {
  clientId: string;
  redirectUri: string;
  scope?: string;
}): OAuthStartResult {
  const state = generateState();
  const url = new URL(`${KITE_OAUTH_BASE}/v1/oauth/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', params.scope || 'payment');
  url.searchParams.set('state', state);
  return { authorizationUrl: url.toString(), state };
}

export async function exchangeOAuthCode(params: {
  code: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
  });
  if (params.clientSecret) body.set('client_secret', params.clientSecret);

  const res = await fetch(`${KITE_OAUTH_BASE}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'unknown' }))) as Record<string, string>;
    throw new KiteMcpError('oauth_error', `Token exchange failed: ${err.error || res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  storeTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    mode: 'user_oauth',
  });

  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

// --- Agent Self-Authentication ---

export async function authenticateAgent(credentials?: {
  agentId: string;
  agentSecret: string;
}): Promise<string> {
  const agentId = credentials?.agentId || process.env.KITE_AGENT_ID || '';
  const agentSecret = credentials?.agentSecret || process.env.KITE_AGENT_SECRET || '';

  if (!agentId || !agentSecret) {
    throw new KiteMcpError('missing_credentials', 'Set KITE_AGENT_ID and KITE_AGENT_SECRET.');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: agentId,
    client_secret: agentSecret,
    scope: 'payment',
  });

  const res = await fetch(`${KITE_OAUTH_BASE}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'unknown' }))) as Record<string, string>;
    throw new KiteMcpError('agent_auth_failed', `Agent self-auth failed: ${err.error || res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  storeTokens({
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    agentId,
    mode: 'agent_self_auth',
  });

  return data.access_token;
}

// --- Unified Connection ---

export async function ensureMcpConnected(): Promise<void> {
  const mcpClient = getKiteMcpClient();
  if (mcpClient.connected) return;

  const cached = getStoredTokens();
  if (cached) {
    const config: KiteMcpConfig = {
      mcpUrl: KITE_MCP_URL,
      accessToken: cached.accessToken,
      agentId: cached.agentId,
    };
    await mcpClient.connect(config);
    return;
  }

  const agentId = process.env.KITE_AGENT_ID;
  const agentSecret = process.env.KITE_AGENT_SECRET;
  if (agentId && agentSecret) {
    const token = await authenticateAgent({ agentId, agentSecret });
    await mcpClient.connect({ mcpUrl: KITE_MCP_URL, accessToken: token, agentId });
    return;
  }

  throw new KiteMcpError('auth_required', 'No authentication. Complete OAuth or configure agent credentials.');
}

export async function connectWithToken(accessToken: string, agentId?: string): Promise<void> {
  const mcpClient = getKiteMcpClient();
  await mcpClient.connect({ mcpUrl: KITE_MCP_URL, accessToken, agentId });
}

export async function disconnectPassport(): Promise<void> {
  const mcpClient = getKiteMcpClient();
  await mcpClient.disconnect();
  clearTokens();
}

export function getPassportStatus(): {
  connected: boolean;
  mode: 'user_oauth' | 'agent_self_auth' | 'none';
  agentId?: string;
  expiresAt?: number;
} {
  const mcpClient = getKiteMcpClient();
  return {
    connected: mcpClient.connected,
    mode: _tokenCache?.mode || 'none',
    agentId: _tokenCache?.agentId || mcpClient.currentConfig?.agentId,
    expiresAt: _tokenCache?.expiresAt,
  };
}

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
