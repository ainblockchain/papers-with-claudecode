# Papers with Claude Code — Demo Script

> **Runtime**: ~3 minutes
> **Prerequisites**: Frontend running at `http://localhost:3000`, HuggingFace Papers open in a browser tab

---

## Act 1: The Problem (30 sec)

### Screen: Browser → `https://huggingface.co/papers`

**Narration:**
"Look at this — HuggingFace Papers. Every single day, dozens of new AI papers drop with code. Transformers, diffusion models, agents, state space models. Each one has a paper, a repo, sometimes a demo. The volume is overwhelming — and even when you find a great paper, actually understanding it is hard. You read the abstract, skim the code, maybe watch a YouTube explainer, and you still don't really get it. The gap between 'published' and 'understood' keeps growing."

**Show:**
1. Scroll through the trending papers list — point out the sheer volume
2. Click into one paper — show the dense PDF, the linked GitHub repo
3. Come back to the list — "Now imagine doing this every day"

---

## Act 2: The Solution — Papers with Claude Code (30 sec)

### Screen: Browser → `http://localhost:3000` (Landing Page)

**Narration:**
"Papers with Claude Code turns any paper-with-code into an interactive learning course. You pick a paper, and it generates a dungeon-style game where you explore concepts room by room, with Claude Code as your AI tutor — and you pay per stage with blockchain micropayments."

**Show:**
1. Landing page hero: "Learn Any Research Paper with AI"
2. Quick scroll past feature cards and How It Works section
3. Click **"Explore Papers"**

---

## Act 3: Pick a Paper and Learn (1.5 min)

### Screen: Browser → `/explore`

**Narration:**
"Here are the trending papers — same papers you just saw on HuggingFace, but now each one is a playable course."

**Show:**
1. Paper cards with Learn/Purchase buttons, star counts, arXiv links
2. Click **"Learn"** on "Attention Is All You Need"

### Screen: Browser → `/learn/attention-is-all-you-need`

**Narration:**
"This is the core experience. Left side: a 2D dungeon room. Right side: Claude Code — your AI tutor. Walk around, interact with concept markers to learn, then pass the quiz at the door to advance."

**Show:**
1. **Move the player** with WASD — walk to a concept marker, press **E**
2. **Concept overlay** appears: "Scaled Dot-Product Attention" with explanation
3. Walk to the **door** → press **E** → **Quiz modal** appears
4. Answer the quiz → correct → door unlocks
5. **Payment modal**: "Unlock Stage 2 — 0.001 USDT" → click **Unlock**
6. Payment confirms on Kite Chain with tx hash
7. **Claude terminal** on the right — ask a question, get an explanation

**Narration:**
"Every stage unlock is a micropayment on Kite Chain. Course creators earn from their content. Your progress is recorded on-chain."

---

## Act 4: The Big Picture (30 sec)

### Screen: Browser → `/village` (quick flash) → Terminal

**Show:**
1. **Village** (5 sec): 2D map with buildings for each course, other learners walking around, leaderboard sidebar
2. Switch to **Terminal**:

**Narration:**
"There's also a social village where learners meet, a dashboard tracking your progress, and behind it all — an autonomous AI agent called Cogito that reads papers, generates courses, and publishes them with x402 pricing. The full stack: ain-js for blockchain, a knowledge graph builder, Kubernetes for real terminal pods per learner, and the frontend tying it all together."

```bash
tree -L 1 /home/comcom/git/papers-with-claudecode/
```

**Narration:**
"Papers with Claude Code closes the gap between 'published' and 'understood.' Pick a paper, play through it, learn with AI, pay the creator. Thank you."

---

## Quick Reference

| Time | Screen | Action |
|------|--------|--------|
| 0:00 | HuggingFace Papers | Scroll trending, show volume and complexity |
| 0:30 | Landing Page `/` | Hero + click "Explore Papers" |
| 1:00 | `/explore` | Browse paper cards, click "Learn" |
| 1:15 | `/learn/...` | Move player, interact with concepts |
| 1:45 | `/learn/...` | Quiz → pass → payment modal → unlock |
| 2:15 | `/learn/...` | Claude terminal: ask a question |
| 2:30 | `/village` + Terminal | Flash village, show project structure |
| 3:00 | — | Closing line |
