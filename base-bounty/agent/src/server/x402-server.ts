import express from 'express';
import Ain from '../ain-import.js';
import { AgentConfig } from '../config.js';
import { createKnowledgeRouter } from './routes/knowledge.js';
import { createCourseRouter } from './routes/course.js';

export interface X402ServerOptions {
  ain: Ain;
  config: AgentConfig;
  baseAddress: string;
  getStatus: () => any;
}

export function createX402Server({ ain, config, baseAddress, getStatus }: X402ServerOptions): express.Application {
  const app = express();
  app.use(express.json());

  // -------------------------------------------------------------------------
  // x402 payment middleware setup (v2.3+)
  // Routes config defines which paths are payment-gated and at what price.
  // If @x402/express is unavailable or setup fails, routes run ungated.
  // -------------------------------------------------------------------------
  let x402Enabled = false;
  try {
    const { paymentMiddleware } = require('@x402/express');
    const { ExactEvmScheme } = require('@x402/evm');
    const { ethers } = require('ethers');

    if (config.basePrivateKey && baseAddress) {
      const provider = new ethers.JsonRpcProvider(config.baseRpcUrl);
      const signer = new ethers.Wallet(config.basePrivateKey, provider);

      const routesConfig: Record<string, { price: string; network: string; config: { description: string } }> = {
        'POST /course/unlock-stage': { price: '$0.001', network: 'base', config: { description: 'Unlock course stage' } },
        'GET /knowledge/explore/*': { price: '$0.005', network: 'base', config: { description: 'Access explorations' } },
        'GET /knowledge/frontier/*': { price: '$0.002', network: 'base', config: { description: 'Access frontier map' } },
        'POST /knowledge/curate': { price: '$0.05', network: 'base', config: { description: 'Curated analysis' } },
        'GET /knowledge/graph': { price: '$0.01', network: 'base', config: { description: 'Access knowledge graph' } },
      };

      const scheme = new ExactEvmScheme(signer);
      app.use(paymentMiddleware(routesConfig, { facilitatorUrl: config.x402FacilitatorUrl, scheme }));
      x402Enabled = true;
      console.log('[x402] Payment middleware enabled');
    }
  } catch (err: any) {
    console.log(`[x402] Payment gating disabled: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // Unauthenticated endpoints
  // -------------------------------------------------------------------------
  app.get('/status', (_req, res) => {
    res.json(getStatus());
  });

  app.get('/health', async (_req, res) => {
    const checks: Record<string, boolean> = {
      server: true,
      x402: x402Enabled,
    };
    try {
      await ain.knowledge.listTopics();
      checks.ainNode = true;
    } catch {
      checks.ainNode = false;
    }
    const healthy = checks.ainNode;
    res.status(healthy ? 200 : 503).json({ healthy, checks });
  });

  // -------------------------------------------------------------------------
  // Knowledge routes (x402 gated when enabled)
  // -------------------------------------------------------------------------
  app.use('/knowledge', createKnowledgeRouter(ain));

  // -------------------------------------------------------------------------
  // Course routes (x402 gated when enabled)
  // -------------------------------------------------------------------------
  app.use('/course', createCourseRouter(ain));

  return app;
}

export function startX402Server(options: X402ServerOptions): Promise<void> {
  return new Promise((resolve) => {
    const app = createX402Server(options);
    app.listen(options.config.x402Port, () => {
      console.log(`[x402] Server listening on port ${options.config.x402Port}`);
      resolve();
    });
  });
}
