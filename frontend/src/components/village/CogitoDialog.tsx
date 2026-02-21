'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVillageStore } from '@/stores/useVillageStore';
import { X, Send, Loader2, Brain, AlertTriangle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { x402Fetch, isX402Ready } from '@/lib/kite/x402-fetch';

const COGITO_URL = process.env.NEXT_PUBLIC_COGITO_URL || 'https://cogito.ainetwork.ai';

interface AgentCard {
  name?: string;
  description?: string;
  skills?: Array<{ id: string; name: string; description?: string }>;
  url?: string;
  provider?: { organization?: string };
}

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  txHash?: string;
}

export function CogitoDialog() {
  const { cogitoDialogOpen, setCogitoDialogOpen } = useVillageStore();
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch A2A agent card on open
  useEffect(() => {
    if (!cogitoDialogOpen) return;
    setCardLoading(true);
    setCardError(null);
    fetch(`${COGITO_URL}/.well-known/agent-card.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((card) => setAgentCard(card))
      .catch((err) => setCardError(err.message))
      .finally(() => setCardLoading(false));
  }, [cogitoDialogOpen]);

  // Focus input on open
  useEffect(() => {
    if (cogitoDialogOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [cogitoDialogOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    if (!cogitoDialogOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCogitoDialogOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cogitoDialogOpen, setCogitoDialogOpen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSendError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setSending(true);

    try {
      // Use x402Fetch to automatically handle 402 payment gating
      const fetcher = isX402Ready() ? x402Fetch : fetch;
      const res = await fetcher('/api/cogito-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as Record<string, string>).error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { reply: string; txHash?: string };
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: data.reply, timestamp: Date.now(), txHash: data.txHash },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  if (!cogitoDialogOpen) return null;

  const x402Ready = isX402Ready();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-teal-700/50 rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-teal-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {agentCard?.name || 'Cogito'}
              </h3>
              <p className="text-[10px] text-teal-400 font-mono">
                Knowledge Agent &middot; A2A
              </p>
            </div>
          </div>
          <button
            onClick={() => setCogitoDialogOpen(false)}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Agent Card Info */}
        {cardLoading && (
          <div className="p-3 flex items-center gap-2 text-xs text-gray-400 border-b border-teal-900/30">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading agent card...
          </div>
        )}
        {cardError && (
          <div className="p-3 text-xs text-yellow-400 border-b border-teal-900/30">
            Agent card unavailable: {cardError}
          </div>
        )}
        {agentCard && !cardLoading && (
          <div className="p-3 border-b border-teal-900/30 space-y-1">
            {agentCard.description && (
              <p className="text-xs text-gray-400">{agentCard.description}</p>
            )}
            {agentCard.skills && agentCard.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {agentCard.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-0.5 rounded-full bg-teal-500/10 text-[10px] text-teal-300 border border-teal-500/20"
                    title={skill.description}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* x402 Payment Notice */}
        {!x402Ready && (
          <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <p className="text-[10px] text-amber-300">
              Responses require x402 micropayment. Configure Kite Passport for auto-pay, or each message will be sent without payment header.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.length === 0 && (
            <div className="text-center text-xs text-gray-500 py-8">
              <Brain className="h-8 w-8 mx-auto mb-2 text-teal-500/30" />
              <p>Ask Cogito about papers, research, or publication guides.</p>
              <p className="text-[10px] mt-1 text-gray-600">Powered by x402 micropayments</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-600/30 text-white'
                    : 'bg-[#16162a] text-gray-300 border border-teal-900/30'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.txHash && (
                  <p className="text-[9px] text-teal-500 mt-1 font-mono">
                    tx: {msg.txHash.slice(0, 10)}...
                  </p>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-[#16162a] border border-teal-900/30 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cogito is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {sendError && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-400 flex-1">{sendError}</p>
            <button
              onClick={() => setSendError(null)}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-teal-900/50 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSend();
              }
            }}
            placeholder="Ask Cogito something..."
            className="flex-1 bg-[#16162a] border border-teal-900/30 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-3"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Footer attribution */}
        <div className="px-3 pb-2 flex items-center justify-center gap-1">
          <p className="text-[9px] text-gray-600">
            Built with <span className="text-teal-500">Claude Code</span> &middot; x402 protocol
          </p>
        </div>
      </div>
    </div>
  );
}
