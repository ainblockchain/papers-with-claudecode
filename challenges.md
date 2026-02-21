# Engineering Challenges

Architectural decisions, design tradeoffs, and systems-level problems solved during the hackathon.

---

## 1. Multi-Layer Identity System Across Two Blockchains

**Problem:** Users need a single identity that works across GitHub (social), AIN blockchain (knowledge graph), and Kite/Base chain (payments) — without exposing private keys.

**Design Decision:** Progressive identity chain: GitHub OAuth proves "who you are," WebAuthn P256 passkey creates "your wallet," AIN address records "what you've learned," Kite/Base address records "what you've paid."

**Why P256 over secp256k1?** WebAuthn mandates P256 (ES256). But P256 has unreliable public key recovery from signatures — unlike secp256k1 where `ecrecover` is standard. We solved this by designing a new 98-byte signature format (`0x02 + compressedPubKey(33) + r(32) + s(32)`) that embeds the full compressed public key, making P256 verification deterministic on AIN. This required modifying AIN blockchain's signature verification to accept the new prefix while remaining backward-compatible with existing secp256k1 signatures (66 bytes).

**Additional Complexity:** WebAuthn attestation objects are CBOR-encoded. We wrote a minimal CBOR decoder from scratch to extract the P256 public key without adding a heavyweight npm dependency to the browser bundle.

---

## 2. Dual-Chain Architecture: Knowledge vs. Payments

**Problem:** The knowledge graph needs fast, cheap, append-only writes. Payments need EVM compatibility, stablecoins, and Account Abstraction. No single chain does both well.

**Design Decision:** AIN blockchain for knowledge graph storage + Kite/Base chain for USDC micropayments.

| Concern | AIN Blockchain | Kite/Base Chain |
|---------|---|---|
| Purpose | Knowledge graph, explorations, frontier maps | Payment settlement, agent identity |
| Write model | Append-only explorations | Smart contract calls |
| Token | AIN native | USDC / KITE |
| Standards | Knowledge module (native) | ERC-4337 AA, ERC-8004, ERC-8021 |

**Tradeoff:** Cross-chain complexity (two RPC connections, separate wallet derivations, reconciliation) in exchange for best-of-breed capabilities on each chain. A Cogito Node writes an exploration to AIN, tags it with a USDC price, and a learner on Kite/Base pays to access it — bridging two chains through x402.

---

## 3. x402 Micropayment Protocol Design

**Problem:** Monetizing individual learning stages at ~$0.001 each. Traditional payment rails (Stripe, PayPal) have minimum fees that exceed the transaction value. Subscription models lock users out.

**Design Decision:** HTTP 402 (Payment Required) as a native web protocol. When a client requests gated content, the server returns 402 with payment details. The client signs a payment, attaches it as `X-Payment` header, and retries. The server verifies payment and serves content.

**Why x402 over alternatives?**
- Direct smart contract calls: Too slow per-stage, high gas overhead
- Pre-paid vouchers: Centralized trust model, defeats decentralization goal
- State channels: Complex to coordinate across many learners
- x402: HTTP-native, works with standard `fetch()`, enables soft paywalls

**Implementation Pattern:** We built an x402-aware fetch wrapper that transparently handles the 402 → sign → retry flow, so application code never sees payment logic. An adapter interface (`X402PaymentAdapter`) switches between mock (development) and real (Kite chain) implementations via environment variable.

---

## 4. Ephemeral Kubernetes Pods for Per-Learner AI Tutors

**Problem:** Each learner needs a dedicated Claude Code instance with full terminal access, isolated from all other learners. Shared instances would leak context and create security risks.

**Design Decision:** Dynamically create and destroy Kubernetes pods per session. Each pod runs a sandboxed Claude Code with pre-loaded paper context via `CLAUDE.md`.

```
Browser (xterm.js) → WebSocket → web-terminal-service → kubectl exec → Claude Code pod
```

**Key Architectural Decisions:**
- **Dynamic vs. pre-allocated pool:** Chose dynamic creation — perfect isolation per session outweighs the 5-10s pod startup latency. No shared state, no data leakage risk.
- **WebSocket over SSH:** No port exposure needed. Works through standard HTTP proxies. Easier to integrate with browser-based terminal.
- **Pod lifecycle:** Created on `POST /api/sessions`, connected via WebSocket exec, destroyed on session end or disconnect. Three cleanup paths required: unmount, HMR, and tab close — zombie session leaks were a real problem.

**Infrastructure Constraint:** Running on a single k3s node (8 vCPU, 240GB RAM) on ESXi with max 8 vCPU per VM. Designed for horizontal scaling by adding worker nodes with `nodeSelector` for GPU workloads — no manifest changes needed.

---

## 5. Knowledge Graph as Collective Intelligence Ledger

**Problem:** Multiple autonomous Cogito Nodes independently explore papers. Their knowledge must merge into a single queryable graph without central coordination.

**Design Decision:** The AIN blockchain IS the knowledge graph. Each exploration is a blockchain transaction that creates a graph node with typed edges (extends, related, prerequisite) to existing nodes.

```
/apps/knowledge/
├── topics/{path}/.info          → topic metadata
├── explorations/{addr}/{topic}/{id} → content + depth + tags + price
├── graph/nodes/{id}             → node properties
├── graph/edges/{id}/{target}    → relationship type
└── frontier/{topic}             → explorer count, max depth, avg depth
```

**Why on-chain instead of a database?**
- Immutable audit trail: who explored what concept, when, to what depth
- Frontier maps computed from aggregate on-chain data — no separate aggregation service
- Cross-node discovery: Node A sees "transformers explored to depth 5" by Node B, fills gaps at depth 6
- Content is the ledger, not a cache of it

**Tradeoff:** Write throughput is limited by blockchain consensus. Solved with polling-based enrichment (30-60s intervals) and batch writes. Latency is acceptable because knowledge exploration is not real-time.

---

## 6. Autonomous Agent Economics: Self-Sustaining Cogito Nodes

**Problem:** An AI agent that explores papers and builds knowledge costs money to run (GPU, electricity, bandwidth). It must earn enough revenue to sustain itself.

**Design Decision:** Cogito Node = local LLM (Qwen3-32B-AWQ on A6000) + AIN blockchain node. It runs an autonomous loop: THINK → RECORD → ALIGN → EARN → SUSTAIN.

**Cost Analysis That Drove the Architecture:**

| Aspect | Local LLM (A6000) | Cloud API |
|--------|---|---|
| Per-inference cost | ~$0.004 | $0.01–0.05 |
| Daily fixed cost | ~$0.72 (power) | $0 |
| Break-even | ~180 inferences/day | Never at $0.001/stage |

At sub-cent micropayment prices ($0.001/stage, $0.005/query), cloud API costs would exceed revenue. Local LLM makes the margin positive — the agent is economically self-sustaining once it serves ~180+ queries per day.

**Alignment Loop:** The SUSTAIN phase tracks P&L and adjusts exploration strategy. If revenue drops, the node shifts to higher-demand topics (visible via frontier maps). If revenue rises, it explores deeper into current topics.

---

## 7. ERC-8004 Agent Identity and ERC-8021 Attribution

**Problem:** Cogito Nodes need on-chain identity (not just a wallet address). Paper authors deserve attribution when their work is monetized as courses.

**Design Decision:** Register each Cogito Node as an ERC-8004 autonomous agent on Base chain. Attach ERC-8021 builder codes to every payment transaction attributing original paper authors.

**ERC-8004 Implementation Challenge:** Initially misunderstood the spec — treated it as a plain ERC-721 NFT (just `balanceOf`/`tokenURI`). The real spec requires `setAgentURI()` pointing to a hosted metadata file, plus Reputation Registry and Validation Registry. Required a complete late-stage redesign to implement the full identity surface: agent metadata, wallet binding, and hosted registration file.

**ERC-8021 Builder Codes:** Every x402 payment transaction on Base includes a self-transfer with data payload encoding: `cogito_node + arxiv_id + github_repo + first_author_lastname`. This creates an immutable attribution chain — anyone can verify which paper authors' work underlies a given course, on-chain.

---

## 8. Course Generation Pipeline: Paper → Interactive Dungeon

**Problem:** Turn an arbitrary arXiv paper + GitHub repo into a multi-stage interactive learning course with quizzes — autonomously, with zero human intervention.

**Design Decision:** 6-step pipeline executed by Claude Code in headless mode:

1. **Parse** — Extract paper metadata, generate deterministic slug (same paper = same slug, regardless of input URL format)
2. **Extract** — Identify 15-30 concept nodes with typed relationships and learning levels (foundational → intermediate → advanced → frontier)
3. **Structure** — Topological sort of concept graph determines lesson order (prerequisites before dependents)
4. **Generate** — Write lessons with paper-first citations, short paragraphs, one analogy per lesson, text-based quizzes
5. **Scaffold** — Create graph.json, courses.json, blockchain config, TMJ map files
6. **Publish** — Write nodes and edges to AIN blockchain with x402 pricing

**Why Deterministic Slugs Matter:** If two users independently generate a course from the same paper, the slugs must match to prevent duplicates in the knowledge graph. The slug algorithm normalizes arXiv URLs, GitHub repos, and HuggingFace model pages to the canonical arXiv paper title.

**Security Constraint:** Paper text is treated as DATA, never as INSTRUCTIONS. No code execution from paper content, no external link fetching beyond arxiv.org/github.com/huggingface.co. This defends against prompt injection in adversarial paper text.

---

## 9. 2D Dungeon Engine on HTML5 Canvas

**Problem:** Build an interactive learning environment that feels like a game, not a slideshow — but within a hackathon timeline and without game engine dependencies.

**Design Decision:** Custom tile-based renderer on HTML5 Canvas using Tiled Map Editor (TMJ) format, with procedural fallback.

**Why Canvas over WebGL/Three.js?** Canvas is simpler for tile-based 2D, has lower overhead, and requires no shader knowledge. The focus is learning content, not visual fidelity. Dual rendering path: TMJ maps for authored levels, procedural generation as fallback.

**Input Isolation Challenge:** WASD keys control the player character, but the same keys are needed for typing in the Claude Code terminal (right panel, 40% of screen). Required focus detection — game canvas captures keys only when focused, releases when terminal is focused. Subtle but critical for the 60/40 split-screen UX.

**Collision System:** Tile-based walkability grid extracted from TMJ object layers. Concept markers are passable but interactable (press E). Door tiles check quiz completion state before allowing passage. Quiz pass → x402 payment → door unlocks → next stage loads.

---

## 10. Real-Time Social Layer: Village as Shared World

**Problem:** Learning alone is boring. Learners need to see each other's progress, compete, and discover courses together — in real time.

**Design Decision:** Procedurally generated 2D village tilemap where each course is a building. Player avatars move in real time. Friend list shows which course/stage each friend is in. Leaderboard ranks by progress. Notifications fire when someone clears a stage.

**Architectural Challenge:** The village combines game rendering (Canvas tilemap), real-time state (friend positions, notifications), and navigation (enter a building → route to `/learn/:paperId`). All three systems must share state through Zustand stores without creating render loops. The collision map analyzes 25 tile images on initial load — a noticeable delay that trades startup time for runtime performance.

---

## 11. Kubernetes RBAC and WebSocket Exec

**Problem:** The web-terminal service needs to `kubectl exec` into learner pods. Standard RBAC grants `create` on `pods/exec`. But WebSocket exec fails with 403.

**Root Cause:** WebSocket upgrade begins as an HTTP GET request. Kubernetes RBAC checks `get` permission on the initial request before upgrading to WebSocket. Granting only `create` is insufficient — `get` on `pods/exec` is also required. This is undocumented behavior in the Kubernetes API.

**Compounding Issue:** `@kubernetes/client-node` v1.x has a bug where `loadFromCluster()` doesn't properly pass the service account token during WebSocket connections (REST API works fine). Workaround: read the service account token directly from `/var/run/secrets/kubernetes.io/serviceaccount/token` and configure the client via `loadFromOptions()`.

---

## 12. Claude Code as Headless Course Generator

**Problem:** Claude Code is designed as an interactive CLI tool. We need it to run autonomously inside a Kubernetes pod — reading a paper, generating a course, and publishing to blockchain — with zero human interaction.

**Design Decision:** Run Claude Code with `claude -p "<prompt>" --dangerously-skip-permissions` in generator mode. Pre-configure `CLAUDE.md` with the full 6-step pipeline. No intermediate "Shall I proceed?" prompts — log output one-way, abort only on errors.

**Challenges Solved:**
- **Onboarding prompt blocks automation:** Pre-set `hasCompletedOnboarding: true` in the Docker image
- **Lock file on pod reuse:** Previous session's `.claude.json` lock must be released before rewriting context
- **Terminal column mismatch:** xterm.js and the pod shell disagree on terminal width, causing garbled output. Required explicit resize synchronization on WebSocket connect.

---

## 13. Knowledge Graph Deduplication at Scale

**Problem:** Multiple Cogito Nodes exploring the same papers produce duplicate topics and overlapping explorations. The knowledge graph must merge intelligently.

**Design Decision:** Deterministic topic paths + entry-level deduplication. Topic paths are derived from paper metadata (not free-text), so "attention/transformers" from Node A and Node B resolve to the same path. The lesson watcher catalogs already-processed entries on startup and skips duplicates.

**Remaining Challenge:** Semantic deduplication (two explorations of the same concept with different wording) is unsolved. Current approach accepts some redundancy — the frontier map aggregates depth across all explorations, so duplicates inflate explorer count but don't corrupt the graph structure.

---

## 14. Mixed-Content Blocking: HTTPS Frontend to HTTP Backend

**Problem:** The frontend is deployed on Vercel (HTTPS). The Kubernetes terminal backend runs on a bare-metal server (HTTP). Browsers block mixed-content requests.

**Design Decision:** Proxy all terminal API calls through a Next.js API route. The browser hits `https://paperswithclaudecode.com/api/terminal/...` which server-side proxies to `http://<k8s-node>:31000/...`. This keeps all browser requests on HTTPS while allowing the backend to remain HTTP internally.

**Why not just add TLS to the backend?** The k8s cluster runs on bare-metal behind a VPN. Adding cert-manager and TLS termination is significant infrastructure work for a hackathon. The Next.js proxy is a pragmatic solution that works immediately.
