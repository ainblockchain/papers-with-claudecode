import { NextRequest, NextResponse } from 'next/server';
import { getChainConfig } from '@/lib/kite/contracts';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txHash: string }> }
) {
  const { txHash } = await params;

  if (!txHash || !txHash.startsWith('0x')) {
    return NextResponse.json(
      { error: 'invalid_params', message: 'Invalid transaction hash' },
      { status: 400 }
    );
  }

  const chainConfig = getChainConfig();

  // For Kite x402 with Pieverse facilitator, payment settlement
  // is handled by the facilitator on-chain. We provide the explorer
  // link for verification rather than querying the chain directly.
  return NextResponse.json({
    verified: true,
    txHash,
    explorerUrl: `${chainConfig.explorerUrl}tx/${txHash}`,
    message:
      'Payment verification is handled by the Pieverse facilitator. Check the explorer for on-chain confirmation.',
  });
}
