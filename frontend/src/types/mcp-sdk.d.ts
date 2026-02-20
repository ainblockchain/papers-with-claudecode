// Type declarations for MCP SDK sub-path exports
// The SDK uses wildcard exports (./*) which TypeScript may not resolve correctly

declare module '@modelcontextprotocol/sdk/client/streamableHttp' {
  import { Transport } from '@modelcontextprotocol/sdk/client';

  export interface StreamableHTTPClientTransportOptions {
    authProvider?: unknown;
    requestInit?: RequestInit;
    fetch?: typeof globalThis.fetch;
    reconnectionOptions?: {
      maxReconnectionDelay: number;
      initialReconnectionDelay: number;
      reconnectionDelayGrowFactor: number;
      maxRetries: number;
    };
    sessionId?: string;
  }

  export class StreamableHTTPClientTransport implements Transport {
    constructor(url: URL, opts?: StreamableHTTPClientTransportOptions);
    start(): Promise<void>;
    close(): Promise<void>;
    send(message: unknown, options?: unknown): Promise<void>;
    terminateSession(): Promise<void>;
    finishAuth(authorizationCode: string): Promise<void>;
    get sessionId(): string | undefined;
    setProtocolVersion(version: string): void;
    get protocolVersion(): string | undefined;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: unknown) => void;
  }
}
