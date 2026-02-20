/**
 * Register domain-specific recipes to the AIN blockchain.
 * Reads .md files from cogito-recipes/ and calls ain.cogito.registerRecipe() for each.
 *
 * Usage: npx tsx scripts/register-recipes.ts
 *
 * Requires AIN_PROVIDER_URL and AIN_PRIVATE_KEY env vars (or ~/.claude/ain-config.json).
 */

import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

// ESM/CJS interop for ain-js
import AinModule from '@ainblockchain/ain-js';
const Ain: any = (AinModule as any).default ?? AinModule;

const RECIPES_DIR = resolve(import.meta.dirname || '.', '../cogito-recipes');

async function main() {
  // Load config: try ain-config.json first, then env vars
  let providerUrl = process.env.AIN_PROVIDER_URL || '';
  let privateKey = process.env.AIN_PRIVATE_KEY || '';

  try {
    const configPath = join(process.env.HOME || '', '.claude/ain-config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    providerUrl = providerUrl || config.providerUrl || 'https://testnet-api.ainetwork.ai';
    privateKey = privateKey || config.privateKey || '';
  } catch {}

  if (!privateKey) {
    console.error('ERROR: No private key found. Set AIN_PRIVATE_KEY or configure ~/.claude/ain-config.json');
    process.exit(1);
  }

  const ain = new Ain(providerUrl);
  const address = ain.wallet.addAndSetDefaultAccount(privateKey);
  console.log(`Address: ${address}`);
  console.log(`Provider: ${providerUrl}`);
  console.log(`Recipes dir: ${RECIPES_DIR}`);
  console.log('');

  const files = readdirSync(RECIPES_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('No .md recipe files found in cogito-recipes/');
    return;
  }

  for (const file of files) {
    const markdown = readFileSync(join(RECIPES_DIR, file), 'utf-8');
    console.log(`Registering: ${file}...`);

    try {
      const result = await ain.cogito.registerRecipe(markdown);
      console.log(`  OK: ${JSON.stringify(result?.result || 'done')}`);
    } catch (err: any) {
      console.error(`  FAILED: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
