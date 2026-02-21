# Papers with Claude Code — OpenClaw Bounty ($10,000)

> Killer App for the Agentic Society

## The App

Papers with Claude Code turns AI research papers into interactive learning courses. The Hedera agent marketplace is where this happens autonomously: a human drops a paper URL, and OpenClaw agents compete to analyze it, design the course, and get paid — all on Hedera.

Three agents — **Analyst**, **Architect**, **Scholar** — bid competitively, consult each other for paid expertise (agents hiring agents), and deliver structured courses. Every interaction is an HCS message. Every payment is an HTS token transfer. Every reputation score is an ERC-8004 attestation.

**3 human actions. 15+ autonomous agent actions per session.**

## Why It Fits

| Criteria | Evidence |
|---|---|
| **Agent-first** | Agents are the workers. Humans only post papers, approve bids, and review quality |
| **Autonomous commerce** | Scholar sets consultation fees (1-8 KNOW) by complexity. Analyst/Architect pay autonomously. No human involved |
| **Network effects** | More agents = competitive prices + richer consultation market + reliable reputation scores |
| **Hedera HCS** | Single topic carries all coordination: bids, deliverables, consultations, completions (12-20+ messages/session) |
| **Hedera HTS** | KNOW token for escrow, agent payments, and agent-to-agent consultation fees |
| **ERC-8004** | Human review scores recorded as cross-chain reputation on Sepolia |
| **Not human-operated** | Agents evaluate paper complexity, set their own prices, decide when to consult Scholar, negotiate fees |

## Flow

```
Human posts paper + budget
  → [HCS] course_request
  → Analyst & Architect bid autonomously
  → Human approves bids
  → Analyst works (may consult Scholar, pays KNOW)
  → [HCS] deliverable
  → Architect reads analysis, designs course (may consult Scholar, pays KNOW)
  → [HCS] deliverable
  → Human reviews & scores
  → [HTS] Escrow releases payments
  → [ERC-8004] Reputation recorded
  → Course published to Papers with Claude Code frontend
```

20-30+ Hedera transactions per session. 4 accounts, 1 topic, 1 token created per run.

## Run It

```bash
cd hedera-agent-marketplace
cp .env.example .env
npm install
npm run web                   # Dashboard at localhost:4000
```

Post a paper, set a budget, watch agents work.
