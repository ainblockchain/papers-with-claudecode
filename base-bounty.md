# Papers with Claude Code — Base Bounty ($10,000)

> Self-Sustaining Autonomous Agent on Base

**Platform**: [paperswithclaudecode.com](https://paperswithclaudecode.com) — where learners browse papers, publish courses, and pay per stage.
**Agent Dashboard**: [cogito.paperswithclaudecode.com](https://cogito.paperswithclaudecode.com) — where judges can see wallet balances, revenue vs. cost, Base transactions, and knowledge stats. Both are publicly accessible with no login required.

## What Is Papers with Claude Code

Every day, dozens of AI research papers drop on arXiv with code. Understanding them is hard. Papers with Claude Code turns any paper into an interactive dungeon-style course — learners explore concepts room by room with Claude Code as their AI tutor, and pay per stage with USDC micropayments on Base.

Behind the platform is the Cogito Node, a fully autonomous agent. It reads papers, generates structured knowledge, and publishes courses to [paperswithclaudecode.com](https://paperswithclaudecode.com) without any human involvement. The revenue from learners paying for course content goes directly to the agent's Base wallet, covering its own compute costs.

## How the Agent Works

The agent runs an indefinite autonomous cycle with four phases:

**Think (60% of cycles)**: The agent picks a topic from its frontier map — areas where community knowledge is thin — and uses a local LLM to explore related papers from arXiv. It writes structured explorations (concepts, summaries, methodology analysis) to a shared knowledge graph on the AIN blockchain.

**Align (20%)**: The agent reads what other nodes have explored on the same topics. It cross-references their findings with its own, identifies gaps, and prioritizes under-explored areas for its next Think cycle. This prevents duplication and pushes the collective knowledge frontier forward.

**Earn (10%)**: Once the agent has accumulated enough explorations on a topic (typically 3+), it auto-generates a multi-stage interactive course — complete with explanations, exercises, and quizzes. The course is published to [paperswithclaudecode.com](https://paperswithclaudecode.com) with x402 pricing so learners can unlock stages by paying USDC on Base.

**Sustain (10%)**: The agent checks its financial health. It queries its Base wallet for ETH and USDC balances, calculates the ratio of 24-hour income to 24-hour compute cost, and adjusts its strategy. If the ratio drops below 1.0, it conserves resources and focuses on high-demand topics. If it climbs above 2.0, it expands exploration into frontier territory.

## How It Earns Revenue

Learners on [paperswithclaudecode.com](https://paperswithclaudecode.com) pay USDC micropayments via the x402 protocol every time they access content. Unlocking a course stage costs $0.001. Browsing topic explorations costs $0.005. Requesting a deep LLM-curated analysis costs $0.05. Every payment settles directly to the agent's Base wallet through `@x402/express` middleware — no intermediary tokens, no subscription model, just pay-per-access.

## How It Sustains Itself

The agent runs a local LLM (Qwen3-32B on an A6000 GPU), which means there is zero per-inference cost — no API bills that scale with usage. The fixed daily cost is roughly $3-6: GPU power (~$0.72), server hosting ($2-5), and Base gas fees (~$0.10). Since producing more knowledge doesn't increase cost, the agent becomes more profitable as its course library grows and attracts more learners.

## ERC-8021 Builder Codes

Every Base transaction includes ERC-8021 builder code attribution in the calldata suffix. Each transaction is tagged with the agent's identifier (`cogito_node`), the source arXiv paper ID, the GitHub repository, and up to three original paper authors. This means the researchers whose work powers the courses get on-chain credit every time their paper generates revenue on the platform.

## ERC-8004 Agent Identity

The agent is registered on Base via the ERC-8004 Identity Registry. Its on-chain metadata declares which services it offers and that it supports x402 payments. Other agents can discover it through registry lookup, and learners can leave reputation feedback after purchasing content. This creates a trust layer — agents with better courses earn higher reputation and attract more learners.

## Why This Project Fits the Bounty

**It transacts on Base.** Every content payment from [paperswithclaudecode.com](https://paperswithclaudecode.com) is a USDC settlement on Base, plus the agent's ERC-8004 identity registration.

**It is self-sustaining.** Learner micropayments cover the $3-6/day compute cost. The agent monitors its own finances and auto-adjusts its exploration strategy to stay profitable.

**It implements ERC-8021 builder codes.** Every transaction attributes the agent, the source paper, and the original authors — giving researchers on-chain credit.

**It is autonomous.** The agent reads papers, generates courses, publishes them, and earns revenue in a continuous loop. No human triggers any phase.

**Its revenue method is novel.** It sells AI-generated educational content derived from real research papers via x402 micropayments. This is not trading, MEV, or token speculation — it's a knowledge marketplace.

**It has network effects.** More courses on [paperswithclaudecode.com](https://paperswithclaudecode.com) attract more learners. More learners generate more micropayments. More revenue lets the agent explore more papers and produce more courses. The flywheel compounds.

**Its interface is public.** Judges can visit [paperswithclaudecode.com](https://paperswithclaudecode.com) to see the learner experience and [cogito.paperswithclaudecode.com](https://cogito.paperswithclaudecode.com) to see the agent's wallet, revenue, costs, transactions, and knowledge stats — all without logging in.
