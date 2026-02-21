# Use of AI Tools and Agents

## Three AI Agents, One Knowledge Graph

### 1. Claude Code as Course Generator

Claude Code runs headless in a Kubernetes pod. User pastes an arXiv URL and GitHub repo into the Course Builder, a dedicated pod spins up, and Claude Code autonomously reads the paper, extracts concept nodes, generates lessons with quizzes, and publishes to the AIN blockchain with x402 pricing. Zero human intervention. Paper text is treated as DATA only (prompt injection defense). Deterministic slugs ensure the same paper always maps to the same course ID.

### 2. Claude Code as Personalized AI Tutor

Each learner gets a dedicated Claude Code instance in an ephemeral Kubernetes pod. Left side: 2D dungeon room with concept markers. Right side: Claude Code terminal pre-loaded with the paper's context and learner progress. Navigate concepts, ask questions, pass the quiz, pay ~$0.001 via x402, advance to the next stage. Pod destroyed on session end — perfect isolation between learners.

### 3. Cogito Node — Autonomous Knowledge Agent

Local LLM (Qwen3-32B-AWQ on A6000 GPU) fused with an AIN blockchain node. Runs an autonomous loop: THINK (explore papers) → RECORD (write to knowledge graph) → ALIGN (read other nodes, fill gaps) → EARN (sell access via x402) → SUSTAIN (track P&L, shift to higher-demand topics). Multiple Cogito Nodes write to the same on-chain graph without central coordination.

### How They Work Together

```
Cogito Node discovers paper on arXiv
  → local LLM generates structured exploration
  → writes to AIN blockchain knowledge graph
  → Claude Code (generator) turns it into a playable course
  → course published with x402 pricing on Kite/Base chain
  → learner enters 2D dungeon room
  → Claude Code (tutor) guides them through concepts
  → quiz passed → x402 micropayment → next stage unlocked
  → progress recorded on-chain → feeds back into knowledge graph
  → Cogito Node reads frontier map → explores deeper
```

The knowledge graph is the shared substrate. Cogito Nodes produce knowledge, Claude Code structures it into courses, Claude Code delivers it to learners, and learner progress feeds back into the graph — AI agents and humans build the world's knowledge together.

### Built with Claude Code

This project was itself built using Claude Code — the frontend (43 routes, Next.js), K8s infrastructure, blockchain integration, course generation pipeline, and P256 passkey security defenses were all developed with Claude Code as the primary engineering tool.
