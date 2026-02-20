// 🔌 ADAPTER 🔗 CROSS-TEAM — x402 protocol payment integration
// KiteX402Adapter for real Kite Chain payments, MockX402Adapter as fallback

import { loadPasskeyInfo } from '@/lib/ain/passkey';

export interface PaymentResult {
  success: boolean;
  receiptId?: string;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
  errorCode?: string;
}

export interface WalletStatus {
  address: string;
  balance: string;
  agentDID: string;
}

export interface X402PaymentAdapter {
  requestPayment(params: {
    stageId: string;
    paperId: string;
    amount: number;
    currency: string;
    stageNum?: number;
    score?: number;
  }): Promise<PaymentResult>;
  verifyPayment(receiptId: string): Promise<boolean>;
  getWalletStatus?(): Promise<WalletStatus>;
}

class KiteX402Adapter implements X402PaymentAdapter {
  async requestPayment(params: {
    stageId: string;
    paperId: string;
    amount: number;
    currency: string;
    stageNum?: number;
    score?: number;
  }): Promise<PaymentResult> {
    try {
      // Send passkey public key so server can derive per-user EVM wallet
      const passkeyInfo = loadPasskeyInfo();
      const res = await fetch('/api/x402/unlock-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: params.paperId,
          stageId: params.stageId,
          stageNum: params.stageNum ?? 0,
          score: params.score ?? 0,
          passkeyPublicKey: passkeyInfo?.publicKey || '',
        }),
      });

      if (res.status === 402) {
        // gokite-aa x402 flow: parse accepts array with payment requirements
        const body = await res.json().catch(() => null);
        if (body?.error === 'insufficient_funds') {
          return {
            success: false,
            error: `Insufficient USDT balance. Required: ${body.required}, Available: ${body.available}`,
            errorCode: 'insufficient_funds',
          };
        }
        return {
          success: false,
          error: 'Payment required. x402 flow initiated.',
          errorCode: 'payment_required',
        };
      }

      if (res.status === 403) {
        const body = await res.json().catch(() => null);
        return { success: false, error: body?.message ?? 'Forbidden', errorCode: body?.error ?? 'forbidden' };
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        return {
          success: false,
          error: body?.message ?? `Request failed (${res.status})`,
          errorCode: body?.error ?? 'unknown',
        };
      }

      const data = await res.json();
      return {
        success: true,
        receiptId: data.txHash,
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
        errorCode: 'network_error',
      };
    }
  }

  async verifyPayment(txHash: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/x402/receipt/${encodeURIComponent(txHash)}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.verified === true;
    } catch {
      return false;
    }
  }

  async getWalletStatus(): Promise<WalletStatus> {
    const res = await fetch('/api/x402/status');
    if (!res.ok) throw new Error(`Failed to fetch wallet status (${res.status})`);
    const data = await res.json();
    return {
      address: data.walletAddress,
      balance: data.balance,
      agentDID: data.agentDID,
    };
  }
}

class MockX402Adapter implements X402PaymentAdapter {
  async requestPayment(params: {
    stageId: string;
    paperId: string;
    amount: number;
    currency: string;
    stageNum?: number;
    score?: number;
  }): Promise<PaymentResult> {
    // Mock: auto-approve after 1s delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockTxHash = `0x${Date.now().toString(16)}${'0'.repeat(40)}`.slice(0, 66);
    return {
      success: true,
      receiptId: `receipt-${Date.now()}-${params.stageId}`,
      txHash: mockTxHash,
      explorerUrl: `https://testnet.kitescan.ai/tx/${mockTxHash}`,
    };
  }

  async verifyPayment(receiptId: string): Promise<boolean> {
    return receiptId.startsWith('receipt-') || receiptId.startsWith('0x');
  }

  async getWalletStatus(): Promise<WalletStatus> {
    return {
      address: '0x' + '1'.repeat(40),
      balance: '0.847',
      agentDID: 'did:kite:learner.eth/claude-tutor/v1',
    };
  }
}

const USE_REAL_KITE = process.env.NEXT_PUBLIC_USE_KITE_CHAIN === 'true';
export const x402Adapter: X402PaymentAdapter = USE_REAL_KITE
  ? new KiteX402Adapter()
  : new MockX402Adapter();
