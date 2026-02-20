import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Query AIN blockchain for learning event history
    let progress;
    try {
      const { ainAdapter } = await import('@/lib/adapters/ain-blockchain');
      const accountInfo = await ainAdapter.getAccountInfo();
      progress = await ainAdapter.getProgress(accountInfo.address);
    } catch {
      // AIN not available — return empty history
      return NextResponse.json({ history: [] });
    }

    // Transform AIN progress data into payment history format
    const history: Array<{
      timestamp: string;
      paperId: string;
      paperTitle: string;
      stageNum?: number;
      amount: string;
      method: string;
      status: string;
    }> = [];

    for (const topic of progress.topics) {
      for (const entry of topic.entries) {
        history.push({
          timestamp: new Date(entry.createdAt).toISOString(),
          paperId: topic.topicPath.replace('courses/', ''),
          paperTitle: entry.title,
          amount: entry.price ? `${entry.price} USDT` : '0 USDT',
          method: entry.depth <= 1 ? 'enroll' : 'stage_complete',
          status: 'confirmed',
        });
      }
    }

    for (const purchase of progress.purchases) {
      history.push({
        timestamp: new Date(purchase.accessedAt).toISOString(),
        paperId: purchase.topicPath.replace('courses/', ''),
        paperTitle: purchase.topicPath,
        amount: `${purchase.amount} ${purchase.currency}`,
        method: 'purchase',
        status: 'confirmed',
      });
    }

    // Sort by timestamp descending
    history.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[x402/history] Error:', error);
    return NextResponse.json(
      {
        error: 'history_error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch payment history',
      },
      { status: 500 }
    );
  }
}
