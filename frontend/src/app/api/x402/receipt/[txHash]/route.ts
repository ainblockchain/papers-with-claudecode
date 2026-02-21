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
  const explorerUrl = `${chainConfig.explorerUrl}tx/${txHash}`;

  // Attempt real on-chain verification via RPC
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_KITE_RPC_URL || chainConfig.rpcUrl;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json();
    const receipt = data.result;

    if (!receipt) {
      return NextResponse.json({
        verified: false,
        txHash,
        explorerUrl,
        message: 'Transaction not found on-chain. It may be pending or invalid.',
      });
    }

    const success = receipt.status === '0x1';
    return NextResponse.json({
      verified: success,
      txHash,
      blockNumber: parseInt(receipt.blockNumber, 16),
      from: receipt.from,
      to: receipt.to,
      gasUsed: parseInt(receipt.gasUsed, 16),
      explorerUrl,
      message: success
        ? 'Transaction confirmed on Kite Chain.'
        : 'Transaction failed on-chain.',
    });
  } catch (error) {
    // If RPC fails, fall back to explorer link
    return NextResponse.json({
      verified: null,
      txHash,
      explorerUrl,
      message: 'Could not verify on-chain. Check the explorer link for confirmation.',
    });
  }
}
