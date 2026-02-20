// Kite Agent Passport MCP Client
// Connects to Kite MCP server for x402 payment operations

import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

const KITE_MCP_URL =
  process.env.KITE_MCP_URL || 'https://neo.dev.gokite.ai/v1/mcp';

export interface KiteMcpConfig {
  mcpUrl: string;
  accessToken?: string;
  agentId?: string;
}

export interface ApprovePaymentParams {
  payer_addr: string;
  payee_addr: string;
  amount: string;
  token_type: string;
  merchant_name?: string;
}

export class KiteMcpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'KiteMcpError';
    this.code = code;
  }
}

function parseMcpToolResult(result: Awaited<ReturnType<Client['callTool']>>): unknown {
  const content = result.content as Array<{ type: string; text?: string }>;
  const textItem = content?.find((c) => c.type === 'text');
  if (!textItem?.text) {
    throw new KiteMcpError('empty_response', 'MCP tool returned empty response');
  }
  try {
    return JSON.parse(textItem.text);
  } catch {
    return { raw: textItem.text };
  }
}

class KiteMcpClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private config: KiteMcpConfig | null = null;
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  get currentConfig(): KiteMcpConfig | null {
    return this.config;
  }

  async connect(config: KiteMcpConfig): Promise<void> {
    if (this._connected) {
      await this.disconnect();
    }

    const url = new URL(config.mcpUrl || KITE_MCP_URL);
    const headers: Record<string, string> = {};
    if (config.accessToken) {
      headers['Authorization'] = `Bearer ${config.accessToken}`;
    }

    this.transport = new StreamableHTTPClientTransport(url, {
      requestInit: Object.keys(headers).length > 0 ? { headers } : undefined,
    });

    this.client = new Client(
      { name: 'papers-lms-agent', version: '1.0.0' },
      { capabilities: {} }
    );

    try {
      await this.client.connect(this.transport);
      this.config = config;
      this._connected = true;
    } catch (err: unknown) {
      this.client = null;
      this.transport = null;
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Unauthorized') || message.includes('401')) {
        throw new KiteMcpError('Unauthorized', 'OAuth token expired or invalid.');
      }
      if (message.includes('session_creation_required')) {
        throw new KiteMcpError('session_creation_required', 'No valid session. Complete OAuth flow.');
      }
      throw new KiteMcpError('connection_failed', `Failed to connect: ${message}`);
    }
  }

  async getPayerAddr(): Promise<string> {
    this.ensureConnected();
    try {
      const result = await this.client!.callTool({ name: 'get_payer_addr', arguments: {} });
      const parsed = parseMcpToolResult(result) as { payer_addr: string };
      if (!parsed.payer_addr) {
        throw new KiteMcpError('invalid_response', 'get_payer_addr missing payer_addr');
      }
      return parsed.payer_addr;
    } catch (err) {
      if (err instanceof KiteMcpError) throw err;
      this.handleToolError(err);
      throw err;
    }
  }

  async approvePayment(params: ApprovePaymentParams): Promise<string> {
    this.ensureConnected();
    try {
      const result = await this.client!.callTool({
        name: 'approve_payment',
        arguments: {
          payer_addr: params.payer_addr,
          payee_addr: params.payee_addr,
          amount: params.amount,
          token_type: params.token_type,
          ...(params.merchant_name && { merchant_name: params.merchant_name }),
        },
      });
      const parsed = parseMcpToolResult(result) as { x_payment: string };
      if (!parsed.x_payment) {
        throw new KiteMcpError('invalid_response', 'approve_payment missing x_payment');
      }
      return parsed.x_payment;
    } catch (err) {
      if (err instanceof KiteMcpError) throw err;
      this.handleToolError(err);
      throw err;
    }
  }

  async listTools(): Promise<Array<{ name: string; description?: string }>> {
    this.ensureConnected();
    const result = await this.client!.listTools();
    return result.tools.map((t) => ({ name: t.name, description: t.description }));
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      try { await this.transport.terminateSession(); } catch { /* ignore */ }
      await this.transport.close();
    }
    this.client = null;
    this.transport = null;
    this.config = null;
    this._connected = false;
  }

  private ensureConnected(): void {
    if (!this.client || !this._connected) {
      throw new KiteMcpError('not_connected', 'MCP client not connected. Call connect() first.');
    }
  }

  private handleToolError(err: unknown): never {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('SessionExpired')) {
      throw new KiteMcpError('SessionExpired', 'Session expired. Re-authenticate.');
    }
    if (message.includes('InsufficientBudget')) {
      throw new KiteMcpError('InsufficientBudget', 'Payment exceeds session budget.');
    }
    if (message.includes('Unauthorized')) {
      throw new KiteMcpError('Unauthorized', 'OAuth token expired.');
    }
    throw new KiteMcpError('tool_error', `MCP tool call failed: ${message}`);
  }
}

let _instance: KiteMcpClient | null = null;

export function getKiteMcpClient(): KiteMcpClient {
  if (!_instance) {
    _instance = new KiteMcpClient();
  }
  return _instance;
}

export function resetKiteMcpClient(): void {
  if (_instance) {
    _instance.disconnect().catch(() => {});
    _instance = null;
  }
}

export { KiteMcpClient };
