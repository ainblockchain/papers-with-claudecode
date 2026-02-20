'use client';

import { useEffect } from 'react';
import { ShieldCheck, Shield, Plug } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgentStore } from '@/stores/useAgentStore';

export function StandingIntentConfig() {
  const { mcpStatus, fetchMcpStatus } = useAgentStore();

  useEffect(() => {
    fetchMcpStatus();
  }, [fetchMcpStatus]);

  const connected = mcpStatus.connected;

  return (
    <Card className="bg-[#1a1a2e] border-gray-700 text-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100">Session Management</CardTitle>
          <Badge
            className={
              connected
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            }
          >
            {connected ? 'Kite Passport Active' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 p-3 bg-[#16162a] rounded-lg border border-gray-700">
          {connected ? (
            <>
              <ShieldCheck className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-200">
                  Kite Passport connected via{' '}
                  {mcpStatus.authMode === 'agent_self_auth'
                    ? 'Agent Self-Auth'
                    : 'User OAuth'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Payment authorization is handled through the gokite-aa x402 protocol
                  with MCP tools (get_payer_addr, approve_payment).
                </p>
                {mcpStatus.agentId && (
                  <p className="text-xs text-[#FF9D00] mt-1">
                    Agent: {mcpStatus.agentId}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <Shield className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-200">
                  Kite Passport not connected
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Configure Kite Agent Passport to enable x402 payments.
                  Use the configuration panel above to connect via OAuth or Agent Self-Auth.
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                  <Plug className="h-3 w-3" />
                  <span>MCP Server: https://neo.dev.gokite.ai/v1/mcp</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
