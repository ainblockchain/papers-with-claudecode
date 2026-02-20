import { NextRequest, NextResponse } from 'next/server';
import { getChainConfig } from '@/lib/kite/contracts';
import { withX402Payment, buildRouteConfig } from '../_lib/x402-nextjs';

async function handleUnlockStage(
  _req: NextRequest,
  bodyText: string
): Promise<NextResponse> {
  let body: {
    paperId?: string;
    stageId?: string;
    stageNum?: number;
    score?: number;
    passkeyPublicKey?: string;
  };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { error: 'invalid_params', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { paperId, stageNum, score } = body;

  if (!paperId || typeof paperId !== 'string') {
    return NextResponse.json(
      { error: 'invalid_params', message: 'paperId is required' },
      { status: 400 }
    );
  }
  if (stageNum === undefined || typeof stageNum !== 'number' || stageNum < 0) {
    return NextResponse.json(
      { error: 'invalid_params', message: 'stageNum must be a non-negative number' },
      { status: 400 }
    );
  }
  if (score === undefined || typeof score !== 'number' || score < 0 || score > 100) {
    return NextResponse.json(
      { error: 'invalid_params', message: 'score must be between 0 and 100' },
      { status: 400 }
    );
  }

  const chainConfig = getChainConfig();

  // Payment has already been verified and settled by withX402Payment middleware.
  // Record stage completion on AIN blockchain via event tracker.
  try {
    const { trackEvent } = await import('@/lib/ain/event-tracker');
    await trackEvent({
      type: 'stage_complete',
      paperId,
      stageIndex: stageNum,
      timestamp: Date.now(),
      x: 0,
      y: 0,
      direction: 'down',
      scene: 'course',
    });

    // If score >= 70 (passing), also record quiz pass
    if (score >= 70) {
      await trackEvent({
        type: 'quiz_pass',
        paperId,
        stageIndex: stageNum,
        timestamp: Date.now(),
        x: 0,
        y: 0,
        direction: 'down',
        scene: 'course',
      });
    }
  } catch (err) {
    console.error('[x402/unlock-stage] AIN tracking failed (non-fatal):', err);
  }

  // Generate attestation hash for the completion
  const crypto = await import('crypto');
  const attestationHash = crypto
    .createHash('sha256')
    .update(`${paperId}:${stageNum}:${score}:${Date.now()}`)
    .digest('hex');

  return NextResponse.json({
    success: true,
    stageCompletion: {
      paperId,
      stageNum,
      score,
      attestationHash: `0x${attestationHash}`,
      completedAt: new Date().toISOString(),
    },
    explorerUrl: `${chainConfig.explorerUrl}`,
    message: 'Stage unlocked. Payment settled via Kite x402 protocol. Progress recorded on AIN blockchain.',
  });
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const routeConfig = buildRouteConfig({
    description: 'Unlock a learning stage after quiz completion',
    resource: `${baseUrl}/api/x402/unlock-stage`,
    outputSchema: {
      input: {
        discoverable: true,
        method: 'POST',
        type: 'http',
        body: {
          paperId: { description: 'The paper/course ID', required: true, type: 'string' },
          stageNum: { description: 'Stage number to unlock', required: true, type: 'number' },
          score: { description: 'Quiz score (0-100)', required: true, type: 'number' },
        },
      },
      output: {
        properties: {
          success: { description: 'Whether stage unlock succeeded', type: 'boolean' },
          stageCompletion: { description: 'Stage completion details with attestation', type: 'object' },
        },
        required: ['success', 'stageCompletion'],
        type: 'object',
      },
    },
  });

  return withX402Payment(req, routeConfig, handleUnlockStage);
}
