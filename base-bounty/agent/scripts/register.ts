import 'dotenv/config';
import Ain from '../src/ain-import.js';
import { AgentIdentity } from '../src/base-chain/identity.js';
import { loadConfig } from '../src/config.js';

const AGENT_URI = 'https://cogito.papers-with-claudecode.ai';

const SEED_TOPICS = [
  { path: 'ai/transformers', title: 'Transformer Architecture', description: 'Neural network architecture based on self-attention mechanism' },
  { path: 'ai/reinforcement-learning', title: 'Reinforcement Learning', description: 'Learning paradigm through environment interaction and rewards' },
  { path: 'crypto/consensus', title: 'Consensus Mechanisms', description: 'Distributed agreement protocols for blockchain networks' },
  { path: 'crypto/defi', title: 'Decentralized Finance', description: 'Financial instruments built on blockchain technology' },
  { path: 'math/category-theory', title: 'Category Theory', description: 'Abstract mathematical theory of structures and relationships' },
];

async function main() {
  const config = loadConfig();

  console.log('=== Cogito Node Registration ===\n');

  // 1. Register ERC-8004 identity on Base
  console.log('1. Registering ERC-8004 identity on Base mainnet...');
  const identity = new AgentIdentity(config.baseRpcUrl, config.ainPrivateKey);
  console.log(`   Wallet address: ${identity.getAddress()}`);

  const isRegistered = await identity.isRegistered();
  if (isRegistered) {
    console.log('   Already registered on ERC-8004!');
  } else {
    console.log(`   Agent URI: ${AGENT_URI}`);
    const result = await identity.register(AGENT_URI);
    console.log(`   Registered! Agent ID: ${result.agentId}`);
    console.log(`   Transaction: ${result.txHash}`);
    console.log(`   BaseScan: https://basescan.org/tx/${result.txHash}`);

    // Fetch on-chain metadata to confirm
    try {
      const metadata = await identity.getTokenMetadata(result.agentId);
      console.log(`   On-chain metadata:`, JSON.stringify(metadata, null, 2));
    } catch {
      console.log('   (Could not fetch on-chain metadata yet)');
    }
  }

  // 2. Setup AIN Knowledge app on devnet
  console.log('\n2. Setting up AIN Knowledge app on devnet...');
  const ain = new Ain(config.ainProviderUrl, config.ainWsUrl || undefined);
  const ainAddress = ain.wallet.addAndSetDefaultAccount(config.ainPrivateKey);
  console.log(`   AIN address: ${ainAddress}`);

  try {
    await ain.knowledge.setupApp({ address: ainAddress });
    console.log('   Knowledge app setup complete.');
  } catch (err: any) {
    console.log(`   Setup skipped (may exist): ${err.message}`);
  }

  // 3. Register seed topics on AIN devnet
  console.log('\n3. Registering seed topics on AIN devnet...');
  for (const topic of SEED_TOPICS) {
    try {
      await ain.knowledge.registerTopic(topic.path, {
        title: topic.title,
        description: topic.description,
      });
      console.log(`   Registered: ${topic.path}`);
    } catch (err: any) {
      console.log(`   Skipped ${topic.path}: ${err.message}`);
    }
  }

  // 4. Summary
  console.log('\n=== Registration Complete ===');
  console.log(`Base Address: ${identity.getAddress()}`);
  console.log(`AIN Address:  ${ainAddress}`);
  console.log(`Agent Name:   ${config.agentName}`);
  console.log(`Agent URI:    ${AGENT_URI}`);
  console.log(`Registry:     0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 (Base mainnet)`);
}

main().catch((err) => {
  console.error('Registration failed:', err);
  process.exit(1);
});
