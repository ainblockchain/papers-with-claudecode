# Kite AI Bounty: Agent-Native Payments & Identity

> AI tutor agents that authenticate themselves, pay for knowledge on your behalf, and record verifiable learning proofs — all on Kite Chain, all autonomous.

---

## What We Built

Papers with Claude Code is an education platform where research papers become interactive courses. An AI tutor agent guides learners through concepts in a 2D dungeon environment. Each stage is gated by an x402 micropayment (~$0.001 in Test USDT on Kite Chain). When a learner passes a quiz, the agent autonomously pays to unlock the next stage — no wallet popups, no manual signing.

**The agent authenticates itself, pays, and records learning proofs on-chain — all without human intervention.**

---

## 5 Mandatory Requirements

| Requirement | Implementation |
|---|---|
| **Build on Kite AI Testnet** | Chain ID 2368, Test USDT (`0x0fF5...e27e63`), LearningLedger deployed at `0xaffB...14A72` ([KiteScan](https://testnet.kitescan.ai/address/0xaffB053eE4fb81c0D3450fDA6db201f901214A72)) |
| **x402 Payment Flows** | **Bidirectional** — we built both sides: Service Provider (7 x402-gated API routes returning HTTP 402, settling via Pieverse facilitator) AND Agent Client (auto-detects 402, calls MCP `approve_payment`, retries with `X-Payment` header) |
| **Verifiable Agent Identity** | WebAuthn P-256 passkey with dual address derivation (AIN + EVM), Agent DID (`did:kite:learner.eth/claude-tutor/v1`), KitePass, Kite Passport OAuth integration |
| **Autonomous Execution** | Agent self-authenticates via `client_credentials` grant, `x402Fetch()` handles the entire 402-pay-retry cycle, zero manual wallet interaction |
| **Open-Source** | MIT license, public repo: [ainblockchain/papers-with-claudecode](https://github.com/ainblockchain/papers-with-claudecode) |

---

## How Agent Autonomy Works

```
1. Server boots → authenticateAgent() with KITE_AGENT_ID + KITE_AGENT_SECRET
2. MCP client connects to Kite MCP server (https://neo.dev.gokite.ai/v1/mcp)
3. Learner passes quiz → agent calls POST /api/x402/unlock-stage
4. Server returns HTTP 402 (gokite-aa scheme, Kite Testnet)
5. Agent auto-triggers tryMcpPayment():
   → get_payer_addr → returns AA wallet address
   → approve_payment → returns signed X-Payment token
6. Agent retries request with X-Payment header
7. Server verifies via Pieverse /v2/verify → settles via /v2/settle
8. On-chain USDT transfer on Kite Chain (sub-second finality)
9. Learning event recorded on AIN Blockchain (stage_complete + attestation hash)
10. Stage unlocks — learner never touched a wallet
```

The entire pipeline from quiz pass to on-chain settlement is fully automated. Humans only configure env vars once.

---

## Correct x402 Usage

### Bidirectional Implementation (Most Projects Only Do One Side)

**Service Provider Side** (`x402-nextjs.ts`):
- 7 x402-gated API routes: `unlock-stage`, `enroll`, `standing-intent`, `attestations`, `receipt`, `status`, `history`
- Each route returns proper 402 response with `gokite-aa` payment scheme
- Pieverse facilitator at `https://facilitator.pieverse.io` handles verify + settle
- Kite network ID: `eip155:2368`, Token: Test USDT

**Agent Client Side** (`x402-fetch.ts`, `mcp-client.ts`):
- `x402Fetch()` wrapper detects 402 responses transparently
- Calls Kite MCP tools (`get_payer_addr`, `approve_payment`) for payment authorization
- Auto-retries with `X-Payment` header
- Application code never sees payment logic

### Error Handling (Every Failure Mode Covered)
| Error | User Experience |
|---|---|
| `insufficient_funds` | Balance error + faucet link (`https://faucet.gokite.ai`) |
| `payment_required` | Prompts Kite Passport connection |
| `SessionExpired` | Re-authentication flow triggered |
| `InsufficientBudget` | Session spending limit warning |
| `Unauthorized` | OAuth re-initiation |

---

## Verifiable Agent Identity

### Three Layers

1. **WebAuthn Passkey (Hardware-Bound)**
   - P-256 keys via `navigator.credentials.create()`, non-exportable
   - Dual address derivation: SHA-256 → AIN address, keccak256 → EVM address
   - Three security defenses: Rogue Key prevention (`verifyAddressBinding`), WebAuthn replay/phishing prevention (`validateClientDataJSON` + `validateAuthenticatorData`), Signature malleability prevention (`enforceCanonicalS`, Low-S rule)

2. **Agent DID + KitePass**
   - DID format: `did:kite:{user}/{agentType}/{version}`
   - BIP-32 hierarchical key derivation: `m/44'/2368'/0'/0/{agentIndex}`
   - KitePass binds agent identity to Standing Intent constraints

3. **Kite Passport OAuth**
   - Integrated as NextAuth v5 custom OAuth provider
   - Dual auth modes: User OAuth (user controls funds) + Agent self-auth (`client_credentials`, zero human interaction)

---

## On-Chain Records (Dual Chain)

| Record | Chain | Verification |
|---|---|---|
| USDT micropayment settlement | **Kite Chain** (2368) | Pieverse `transferWithAuthorization` → [KiteScan](https://testnet.kitescan.ai) |
| Course enrollment events | **AIN Blockchain** | `course_enter` event with timestamp |
| Stage completion attestations | **AIN Blockchain** | SHA-256(paperId + stageNum + score + timestamp) |
| Knowledge graph relationships | **AIN Blockchain** | Topic nodes with typed edges |

Dual-chain architecture is richer than single-chain: Kite handles fast payment settlement, AIN handles portable learning credentials.

---

## Security Controls

| Measure | Implementation |
|---|---|
| Key isolation | WebAuthn P-256 in hardware secure enclave, never exportable |
| CSRF protection | OAuth state parameter validated on callback |
| Token security | Server-side MCP proxy — browser never sees access tokens |
| Spending limits | Standing Intent: per-tx max, daily cap, contract whitelist, function whitelist, TTL |
| Signature safety | Low-S enforcement, constant-time comparison, rpIdHash validation |
| Session management | Automatic token expiry detection with 60-second buffer |

---

## Bonus Points

| Criterion | Our Implementation |
|---|---|
| **Multi-Agent Coordination** | Student agent (browser) + Server agent (Next.js, self-auth) + Kite MCP server — 3-party collaboration per payment |
| **Gasless UX** | Pieverse facilitator handles gas; users only pay Test USDT |
| **Security Controls** | Standing Intent limits, OAuth validation, token isolation, WebAuthn hardware keys |

---

## Live Demo Visualization

### What Judges See

1. **Agent Identity**: Agent Dashboard shows DID, AA wallet address, KitePass status, Kite Passport connection
2. **Payment Flow**: Learner passes quiz → AI agent says "Unlocking next stage..." → terminal shows 402→pay→200 flow → tx hash + KiteScan link
3. **On-Chain Confirmation**: Click KiteScan link → see USDT transfer on Kite Testnet
4. **Failure Handling**: Insufficient balance → error with faucet link, session expired → re-auth prompt
5. **Learning Attestations**: On-chain SHA-256 hashes proving quiz completion, scores, timestamps

---

## What Makes Us Different

| | Typical Hackathon Project | Papers with Claude Code |
|---|---|---|
| **x402 Direction** | Client only (calls weather API) | **Bidirectional** — built both Service Provider AND Agent Client |
| **On-Chain Data** | Payment receipt only | Payments on Kite + Learning attestations on AIN (dual chain) |
| **Use Case** | Demo/toy (call one API) | **Real education platform** with 43 routes, 2D dungeon, AI tutor |
| **Auth** | Single wallet | WebAuthn passkey + Agent DID + Kite Passport OAuth (3 layers) |
| **UI** | CLI or simple form | 2D dungeon maps, AI terminal, Agent Dashboard, knowledge graph, payment history |
| **Architecture** | Script | Next.js 16, Zustand, adapter pattern, TypeScript strict mode — production-grade |

---

## Architecture

```
┌────────────── Papers with Claude Code ──────────────┐
│                                                       │
│  Service Provider          Agent Client               │
│  ├─ 7 x402-gated routes   ├─ MCP Client (SDK)       │
│  ├─ HTTP 402 responses     ├─ get_payer_addr         │
│  ├─ gokite-aa scheme       ├─ approve_payment        │
│  └─ Pieverse settle        ├─ x402Fetch auto-retry   │
│                             └─ Agent self-auth        │
│                                                       │
│  Verifiable Identity       On-Chain Records           │
│  ├─ WebAuthn P-256         ├─ Kite: USDT settlement  │
│  ├─ Agent DID              ├─ AIN: learning events   │
│  ├─ KitePass               ├─ AIN: attestation hash  │
│  └─ Kite Passport OAuth    └─ AIN: knowledge graph   │
│                                                       │
│  UI: 2D dungeon + AI terminal + Agent Dashboard      │
│      + payment modal + knowledge graph explorer       │
└───────────────────────────────────────────────────────┘
        │                │                │
  Kite Chain       Kite MCP Server    AIN Blockchain
  (Testnet 2368)   (neo.dev.gokite)   (Knowledge)
  USDT settlement  OAuth + tools      Events + proofs
```

---

## Key Files

| File | Purpose |
|---|---|
| `src/lib/kite/mcp-client.ts` | MCP client — `get_payer_addr`, `approve_payment` |
| `src/lib/kite/passport-auth.ts` | Dual auth: User OAuth + Agent self-auth |
| `src/lib/kite/x402-fetch.ts` | x402-aware fetch wrapper (402→pay→retry) |
| `src/lib/kite/identity.ts` | Agent DID + KitePass creation |
| `src/lib/kite/contracts.ts` | Kite Chain config, Test USDT address |
| `src/app/api/x402/_lib/x402-nextjs.ts` | Service Provider middleware (Pieverse verify/settle) |
| `src/app/api/x402/unlock-stage/route.ts` | x402-gated stage unlock + AIN recording |
| `src/app/api/kite-mcp/tools/route.ts` | Server-side MCP tool proxy |
| `src/lib/ain/passkey.ts` | WebAuthn P-256 with 3 security defenses |
| `src/lib/adapters/x402.ts` | KiteX402Adapter with auto MCP payment |
| `kiteAi/contracts/LearningLedger.sol` | On-chain enrollment + stage completion |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1 (App Router) |
| Language | TypeScript 5 (strict) |
| Blockchain (Kite) | ethers 6, Pieverse facilitator, Chain 2368 |
| Blockchain (AIN) | @ainblockchain/ain-js |
| MCP | @modelcontextprotocol/sdk |
| Auth | next-auth 5 (GitHub + Kite Passport), WebAuthn |
| Smart Contract | Solidity 0.8.20, Hardhat |
| UI | Tailwind CSS 4, Radix UI, xterm.js |

---

## Summary

Papers with Claude Code demonstrates that Kite AI's agent-native payment infrastructure works for real applications. An AI tutor agent self-authenticates via Kite Passport, autonomously pays sub-cent micropayments through x402 on Kite Chain, and records verifiable learning proofs on a second blockchain — with the learner never touching a wallet. We built both sides of x402 (service provider + agent client), implemented three layers of verifiable identity, and shipped a production-grade education platform, not a demo.
