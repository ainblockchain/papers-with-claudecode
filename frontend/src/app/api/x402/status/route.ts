import { NextRequest, NextResponse } from 'next/server';
import { getChainConfig } from '@/lib/kite/contracts';

export async function GET(req: NextRequest) {
  try {
    const chainConfig = getChainConfig();
    const agentDID =
      process.env.NEXT_PUBLIC_AGENT_DID || 'did:kite:learner.eth/claude-tutor/v1';
    const merchantWallet = process.env.KITE_MERCHANT_WALLET || '';

    // Try to get AIN account info for balance display
    let ainAddress: string | null = null;
    let ainBalance = 0;
    try {
      const { ainAdapter } = await import('@/lib/adapters/ain-blockchain');
      const accountInfo = await ainAdapter.getAccountInfo();
      ainAddress = accountInfo.address;
      ainBalance = accountInfo.balance;
    } catch {
      // AIN not configured — continue without it
    }

    return NextResponse.json({
      agentDID,
      walletAddress: merchantWallet || ainAddress,
      ainAddress,
      ainBalance,
      chainId: chainConfig.chainId,
      network: chainConfig.network,
      explorerUrl: merchantWallet
        ? `${chainConfig.explorerUrl}address/${merchantWallet}`
        : chainConfig.explorerUrl,
      protocol: {
        scheme: 'gokite-aa',
        asset: '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63',
        assetName: 'Test USDT',
        facilitator: 'https://facilitator.pieverse.io',
      },
      configured: !!merchantWallet,
    });
  } catch (error) {
    console.error('[x402/status] Error:', error);
    return NextResponse.json(
      {
        error: 'status_error',
        message:
          error instanceof Error ? error.message : 'Failed to fetch agent status',
      },
      { status: 500 }
    );
  }
}
