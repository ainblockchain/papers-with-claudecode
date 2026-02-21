# 0G Basic Course

> Start building on 0G — the decentralized AI operating system — with a beginner-friendly introduction to all four services: Chain, Storage, Compute, and DA.

**Source**: Official 0G Documentation (docs.0g.ai)
**Format**: AI-tutored interactive course
**Time**: ~2 hours to complete all 3 modules

---

## Quick Start (3 minutes)

```bash
# 1. Install dependencies
npm install @0glabs/0g-ts-sdk ethers openai dotenv

# 2. Set up environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY

# 3. Get testnet tokens
# Visit https://faucet.0g.ai and paste your wallet address

# 4. Run your first storage upload
npx ts-node examples/01-first-upload.ts
```

---

## Course Overview

| Module | Topic | Concepts | Level |
|---|---|---|---|
| 1 | Understanding 0G | 4 concepts | Beginner |
| 2 | Getting Started with 0G | 4 concepts | Beginner |
| 3 | Building Your First 0G App | 4 concepts | Beginner |

**12 concepts total** — from "what is 0G?" to "build a verifiable AI pipeline".

---

## Module 1: Understanding 0G

**What you'll learn**: The big picture — what 0G is, why it matters, and how its four services work together.

**Key concepts**:
- `what_is_0g` — The decentralized AI operating system
- `four_services_overview` — Chain + Storage + Compute + DA explained simply
- `why_decentralized_ai` — Why not just use AWS and OpenAI?
- `0g_ecosystem` — Networks, tokens, and key resources

**Network Quick Reference**:

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| Testnet (Galileo) | 16602 | https://evmrpc-testnet.0g.ai | https://chainscan-galileo.0g.ai |
| Mainnet (Aristotle) | 16661 | https://evmrpc.0g.ai | https://chainscan.0g.ai |

---

## Module 2: Getting Started with 0G

**What you'll learn**: Set up your wallet, get testnet tokens, and run your first hands-on interactions with Storage and Compute.

**Key concepts**:
- `wallet_and_network_setup` — MetaMask + 0G Testnet + private key safety
- `first_storage_upload` — Upload a file, save the rootHash, download it back
- `first_ai_inference` — OpenAI-compatible inference, 2-line migration
- `reading_chain_data` — ethers.js on 0G Chain, using the block explorer

**Core pattern for Storage**:
```typescript
import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';

const file = await ZgFile.fromFilePath('./my-file.txt');
const [tree] = await file.merkleTree();
const rootHash = tree!.rootHash();  // ← Your file's permanent identity

await indexer.upload(file, RPC_URL, signer);
await file.close();
```

**Core pattern for Compute** (2-line change from OpenAI):
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.ZG_API_KEY,             // ← Change 1
  baseURL: process.env.ZG_PROVIDER_URL + '/v1/proxy', // ← Change 2
});
```

---

## Module 3: Building Your First 0G App

**What you'll learn**: Connect Storage + Compute + Chain into a complete, verifiable AI pipeline.

**Key concepts**:
- `app_architecture_basics` — Which service to use for what
- `storage_compute_integration` — Upload → AI process → store result
- `on_chain_data_recording` — Recording provenance with smart contracts
- `next_steps` — KV storage, fine-tuning, DA, and advanced patterns

**The full-stack pipeline**:
```
1. User uploads document → 0G Storage (rootHash)
2. Document rootHash recorded → 0G Chain (provenance)
3. AI analyzes document → 0G Compute (LLM inference)
4. AI result stored → 0G Storage (resultHash)
5. Result hash linked on-chain → permanent, verifiable audit trail
```

---

## Contract Addresses Reference

### Testnet (Galileo, chainId: 16602)

| Contract | Address |
|---|---|
| Flow (Storage) | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| DAEntrance | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |
| Compute Ledger | `0xE70830508dAc0A97e6c087c75f402f9Be669E406` |
| DASigners (precompile) | `0x0000000000000000000000000000000000001000` |
| WrappedOGBase (precompile) | `0x0000000000000000000000000000000000001001` |

---

## Course Files

```
0g-basic-course/
├── CLAUDE.md             ← AI tutor instructions
├── README.md             ← This file
├── knowledge/
│   ├── graph.json        ← Knowledge graph (12 nodes, 15 edges)
│   └── courses.json      ← Full curriculum (3 modules, 12 lessons)
```

---

## Resources

- **Documentation**: https://docs.0g.ai
- **Builder Hub**: https://build.0g.ai
- **Faucet**: https://faucet.0g.ai
- **Explorer (Testnet)**: https://chainscan-galileo.0g.ai
- **Explorer (Mainnet)**: https://chainscan.0g.ai
- **Storage Explorer**: https://storagescan.0g.ai

---

## Using the AI Tutor

This course includes a CLAUDE.md that configures an AI tutor. To use it:

```bash
cd 0g-basic-course
claude  # Opens Claude Code with CLAUDE.md tutor instructions loaded
```

Then ask the AI to teach you any concept:
- "Explain what 0G Storage is and how it's different from S3"
- "Walk me through setting up my wallet for 0G testnet"
- "Help me upload my first file to 0G Storage"
- "How does AI inference work on 0G Compute?"

---

*Generated by Papers with Claude Code — 0G Bounty Submission*
*Source: 0G Labs, 2024 — 0G Developer Documentation (docs.0g.ai)*
