# 0G on Papers with Claude Code

### Interactive, gamified developer education for the 0G ecosystem

Building on 0G means navigating 19,000+ lines of documentation, finding buried configuration requirements (like `evmVersion: 'cancun'` for Hardhat), and discovering through trial-and-error that six CLI commands must run in exact order before any AI inference request will work. Developers give up before they write a single line of productive code.

This project solves that with:

- **Two complete 0G courses** — a beginner track (12 concepts, ~2 hours) and a developer track (25 concepts, ~4 hours) with structured modules, knowledge graphs, and AI tutors configured as 0G domain experts
- **Five runnable TypeScript examples** that connect to live 0G testnet today — upload files, download with Merkle proof verification, read/write KV storage, run AI inference on decentralized GPUs, and execute a full Storage+Compute+Chain pipeline
- **A gamified 2D pixel-art RPG learning environment** with a custom 0G space theme (planet surface, space mountains, portal doors, and a Space Panda character), where progress is gated by on-chain x402 micropayments

> **Live**: [paperswithclaudecode.com](https://paperswithclaudecode.com)
> **Quick demo**: `cd 0g-developer-course/examples && npm install && npm run demo`

---

## Why This Fits the Bounty

### Usefulness (30%)

The 0G documentation at docs.0g.ai is comprehensive but presents real onboarding friction:

| Friction point | Where it's buried | How this project solves it |
|---|---|---|
| `evmVersion: 'cancun'` required for Hardhat | Mentioned once in deployment guide | Highlighted with a "REQUIRED" warning in Module 4, CLAUDE.md, and the Hardhat config block |
| 6-step Compute CLI setup sequence | Spread across 3 documentation sections | Consolidated into a single ordered list in Module 3, with the exact commands ready to copy-paste |
| Indexer URL differs from RPC URL | Only in SDK reference examples | Explicitly separated in every code example and the `.env.example` file |
| rootHash must be saved immediately | Implied but never emphasized | Called out as the #1 beginner mistake in CLAUDE.md and every upload example |
| Provider acknowledgement required before inference | Deep in Compute API docs | Step 5 of 6 in the CLI setup, with a warning that requests fail silently without it |

The first successful 0G Storage upload is achievable in **5 minutes** from a blank machine using the examples in this project.

### Quality & Maintainability (25%)

The educational content follows a clean separation of concerns:

```
knowledge/graph.json    → Structured dependency graph (typed edges: requires, enables, evolves_to)
knowledge/courses.json  → Full curriculum text (lessons, key ideas, quizzes)
examples/               → Standalone runnable TypeScript (proper error handling, early exit on misconfig)
CLAUDE.md               → AI tutor configuration (domain facts, teaching style, common mistakes)
```

Each artifact can be updated independently. The knowledge graph uses typed relationships (`component_of`, `requires`, `enables`, `evolves_to`) that encode pedagogical ordering, not just flat topic lists. TypeScript examples check for required env vars before executing, save state between runs (`last-root-hash.txt`), and include actionable error messages.

### Clarity & Documentation (20%)

- 2 course READMEs with quick start guides and module breakdowns
- 2 CLAUDE.md files with domain-specific tutor instructions
- 1 environment setup guide (`examples/00-setup.md`)
- Every contract address documented in README, CLAUDE.md, and knowledge graph nodes
- Network reference tables (testnet vs mainnet) appear where needed, not "see the documentation"

### Reusability (15%)

This is a template. Another team building on a different protocol can:

1. Replace `knowledge/graph.json` and `knowledge/courses.json` with their own curriculum
2. Rewrite `CLAUDE.md` with their own tutor persona and domain facts
3. Add their own `examples/` folder
4. Create a `paper.json` with metadata — the platform ingests it automatically

The pattern — **graph + curriculum + tutor config + runnable examples** — is the reusable artifact.

### Polish (10%)

0G courses get an exclusive visual identity on the platform:

- **Space Panda**: A hand-crafted 32x32 pixel-art astronaut panda with cyan visor, oxygen accent, and full walk animations in 4 directions — encoded as palette-indexed TypeScript arrays
- **Planet tileset**: Purple planet floor with crater noise, space mountain walls, glowing crystal decorations — procedurally varied per world coordinate
- **Portal door**: Glowing cyan/red circular aperture replacing the standard wooden door
- **Space outposts**: Holographic terminals replacing standard blackboard concept markers
- **Cyan color scheme**: All 0G interactions use `#00FFFF` instead of the platform's default orange
- **Custom card backgrounds**: `assets/basic-bg.png` and `assets/developer-bg.jpg` on the explore page

---

## The Two Courses

### 0G Basic Course

> For developers with no blockchain experience. Get from zero to a working 0G app in ~2 hours.

| Module | Topic | Concepts |
|---|---|---|
| 1 | Understanding 0G | What is 0G, four services overview, why decentralized AI, ecosystem & resources |
| 2 | Getting Started | Wallet setup, first storage upload, first AI inference, reading chain data |
| 3 | Build Your First App | App architecture, storage + compute integration, on-chain recording, next steps |

**AI tutor style**: Beginner-first. Uses analogies before code ("0G Storage = decentralized S3"). Explains every acronym. Diagnoses the 5 most common beginner mistakes: not saving rootHash, wrong MetaMask network, committing .env, skipping provider acknowledgement, missing `evmVersion`.

### 0G Developer Course

> For web2 or Ethereum developers who want to build production apps on 0G. ~4 hours with 5 runnable examples.

| Module | Topic | Concepts | Level |
|---|---|---|---|
| 1 | 0G Foundations | 5 concepts | Foundational |
| 2 | 0G Storage SDK | 6 concepts | Intermediate |
| 3 | 0G Compute Network | 5 concepts | Intermediate |
| 4 | 0G Chain & Smart Contracts | 5 concepts | Advanced |
| 5 | Advanced 0G Patterns | 4 concepts | Frontier |

**Highlights**:
- Module 2 covers both Log (immutable) and KV (mutable) storage layers with runnable examples for each
- Module 3 includes the complete 6-step CLI setup and the 2-line OpenAI migration
- Module 4 covers the critical `evmVersion: 'cancun'` Hardhat/Foundry config, DASigners precompile, and OP Stack / Arbitrum Nitro rollup integration
- Module 5 reaches frontier topics: ERC-7857 INFTs (tokenized AI agents), the AI Agent Storage Pattern, Goldsky indexing, and a full-stack capstone

**AI tutor style**: Developer-first. Shows exact TypeScript code. Cites official 0G documentation. Systematic error diagnosis.

### Side-by-Side

| | Basic Course | Developer Course |
|---|---|---|
| Audience | Blockchain beginners | Web2/Ethereum devs |
| Time | ~2 hours | ~4 hours |
| Modules | 3 | 5 |
| Concepts | 12 | 25 |
| Knowledge graph edges | 15 | 32 (typed) |
| Runnable examples | Inline patterns | 5 TypeScript files |
| Tutor style | Analogies first | Code first |
| Frontier topics | No | ERC-7857, Goldsky, rollups |

---

## Quick Start

### Path A: Run the examples (5 minutes)

```bash
# Navigate to the developer course examples
cd 0g-developer-course/examples

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env: add your PRIVATE_KEY (without 0x prefix)

# Get testnet tokens at https://faucet.0g.ai

# Run the full-stack demo
npm run demo
```

The demo uploads a dataset to 0G Storage, registers the rootHash on-chain (simulated), runs AI analysis via 0G Compute, and stores the result back to Storage — all in one script.

**All available examples:**

| Command | What it does | Course Module |
|---|---|---|
| `npm run upload` | Upload a file to 0G Storage, save rootHash | Module 2 |
| `npm run download` | Download by rootHash with Merkle proof verification | Module 2 |
| `npm run kv` | Write/read key-value pairs via Batcher + KvClient | Module 2 |
| `npm run infer` | OpenAI-compatible AI inference on 0G Compute | Module 3 |
| `npm run demo` | Full pipeline: Storage + Chain + Compute + Storage | Module 5 |

### Path B: Use the AI tutor

```bash
# Install Claude Code if you don't have it
npm install -g @anthropic-ai/claude-code

# Start the beginner course tutor
cd 0g-basic-course
claude

# Or the developer course tutor
cd 0g-developer-course
claude
```

Then ask:
- "Walk me through Module 1"
- "Help me upload my first file to 0G Storage"
- "Why does my Hardhat deployment fail on 0G?" (Answer: missing `evmVersion: 'cancun'`)
- "What's the difference between Log storage and KV storage?"

### Path C: Experience the full platform

Visit [paperswithclaudecode.com](https://paperswithclaudecode.com), sign in with GitHub, find the 0G course in the explore page, and enter the 2D RPG learning environment with the Space Panda.

---

## The 2-Line OpenAI Migration

The single most compelling demonstration in this project — migrate from OpenAI to 0G Compute by changing two lines:

```typescript
// Before (OpenAI):
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// After (0G Compute — 90% cheaper, same API):
const client = new OpenAI({
  apiKey: process.env.ZG_API_KEY,                           // ← Line 1
  baseURL: process.env.ZG_PROVIDER_URL + '/v1/proxy',      // ← Line 2
});

// Everything else stays the same
const response = await client.chat.completions.create({
  model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  messages: [{ role: 'user', content: 'Summarize this dataset...' }],
});
```

Run it: `npm run infer`

---

## The Platform Experience

The learning interface is a **60/40 split**: the left panel is a 2D tile-based RPG game (HTML5 Canvas, WASD/arrow keys), and the right panel is a real Claude Code terminal running in a Kubernetes sandbox pod with the course repository pre-loaded.

**Learning flow per stage:**
1. Walk around the room, approach concept markers (space outposts in 0G theme) → press `E` to read the lesson
2. Approach the door → a quiz appears (multiple-choice from the knowledge graph)
3. Pass the quiz → quiz result is recorded on AIN blockchain
4. Pay $0.001 via x402 protocol (Kite Chain or Base Sepolia) → door unlocks
5. Enter the next stage → repeat until course complete

**0G-exclusive visuals:**
- Planet surface floor with procedurally generated crater textures
- Space mountain walls with silhouette lighting
- Glowing portal door (cyan/red aperture)
- Space Panda character — 32x32 pixel-art astronaut panda with walk animations
- Crystal decorations scattered across each room

**Tech stack:**

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, HTML5 Canvas |
| State | Zustand 5 |
| Terminal | xterm.js + Kubernetes pods running Claude Code |
| Payments | x402 protocol on Kite Chain and Base Sepolia |
| Auth | WebAuthn/Passkeys (P-256), GitHub OAuth |
| Progress tracking | AIN blockchain (on-chain knowledge graph) |
| 0G integration | `@0glabs/0g-ts-sdk`, `ethers` v6, `openai` v4 |

---

## Project Structure

```
0G/
├── README.md                              ← This file
├── paper.json                             ← Platform metadata (title, badge, background)
├── assets/
│   └── developer-bg.jpg                   ← Background for developer course card
├── docs/
│   ├── 0g-docs-full.txt                   ← Complete docs.0g.ai (19,150 lines)
│   ├── 0g-docs-filtered.txt              ← AI-filtered developer-relevant excerpt
│   └── 0g-docs-filtered-long.txt         ← Extended filtered version
├── 0g-basic-course/
│   ├── CLAUDE.md                          ← AI tutor: beginner persona, 5 common mistakes
│   ├── README.md                          ← Course documentation
│   └── knowledge/
│       ├── graph.json                     ← Knowledge graph (12 nodes, 15 edges)
│       └── courses.json                   ← Full curriculum (3 modules, 12 lessons)
└── 0g-developer-course/
    ├── CLAUDE.md                          ← AI tutor: developer persona, exact addresses
    ├── README.md                          ← Course documentation
    ├── thumbnail.jpg                      ← Course thumbnail
    ├── knowledge/
    │   ├── graph.json                     ← Knowledge graph (25 nodes, 32 typed edges)
    │   └── courses.json                   ← Full curriculum (5 modules, 25 lessons)
    ├── examples/
    │   ├── 00-setup.md                    ← 10-minute environment setup guide
    │   ├── 01-storage-upload.ts           ← Upload file → get rootHash
    │   ├── 02-storage-download.ts         ← Download by rootHash + Merkle verify
    │   ├── 03-kv-storage.ts              ← KV read/write via Batcher + KvClient
    │   ├── 04-compute-inference.ts        ← OpenAI-compatible inference on 0G
    │   ├── 05-full-stack.ts              ← Full pipeline: Storage+Chain+Compute
    │   ├── package.json                   ← npm scripts: upload, download, kv, infer, demo
    │   ├── tsconfig.json                  ← TypeScript configuration
    │   └── .env.example                   ← Required environment variables
    └── blockchain/
        ├── config.json                    ← Knowledge graph metadata
        └── package.json
```

---

## Contract Addresses Reference

### Testnet (Galileo, chainId: 16602)

| Contract | Address |
|---|---|
| Flow (Storage) | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| Mine (Mining) | `0x00A9E9604b0538e06b268Fb297Df333337f9593b` |
| Reward | `0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69` |
| DAEntrance | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |
| Compute Ledger | `0xE70830508dAc0A97e6c087c75f402f9Be669E406` |
| Compute Inference | `0xa79F4c8311FF93C06b8CfB403690cc987c93F91E` |
| Compute FineTuning | `0xaC66eBd174435c04F1449BBa08157a707B6fa7b1` |
| DASigners (precompile) | `0x0000000000000000000000000000000000001000` |
| WrappedOGBase (precompile) | `0x0000000000000000000000000000000000001001` |

### Mainnet (Aristotle, chainId: 16661)

| Contract | Address |
|---|---|
| Flow | `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526` |
| Compute Ledger | `0x2dE54c845Cd948B72D2e32e39586fe89607074E3` |

---

## Resources

| Resource | URL |
|---|---|
| Platform (live) | https://paperswithclaudecode.com |
| 0G Documentation | https://docs.0g.ai |
| 0G Builder Hub | https://build.0g.ai |
| 0G SDKs & Tools | https://build.0g.ai/sdks |
| Testnet Faucet | https://faucet.0g.ai |
| Testnet Explorer | https://chainscan-galileo.0g.ai |
| Mainnet Explorer | https://chainscan.0g.ai |
| Storage Explorer | https://storagescan.0g.ai |
| 0G GitHub | https://github.com/0glabs |

---

*Built with [Papers with Claude Code](https://paperswithclaudecode.com) — turning documentation into interactive developer education.*
*Source: 0G Labs — 0G Developer Documentation (docs.0g.ai)*
