# Papers with Claude Code — Demo Script

> **Runtime**: ~15 minutes
> **Prerequisites**: Frontend running at `http://localhost:3000` (or deployed URL), backend API available
> **Blockchain**: AIN devnet with seeded topics and genesis papers, Kite Chain for x402 payments

---

## Act 1: The Big Picture (1.5 min)

### Screen: Terminal

**Narration:**
"Papers with Claude Code transforms arXiv papers, GitHub repos, and HuggingFace models into interactive, gamified learning courses — powered by Claude Code. Learners explore a 2D village, enter dungeon-style stages, answer quizzes, and pay with micropayments to unlock content. Everything is recorded on the AIN blockchain."

**Show:**
```bash
tree -L 1 /home/comcom/git/papers-with-claudecode/
```

**Highlight:**
- `frontend/` — the main learner app (what we'll demo today)
- `ain-js/` — blockchain SDK powering all on-chain operations
- `cogito/` — autonomous enrichment engine (reads papers, generates courses)
- `base-bounty/` — Cogito Node dashboard (agent economics, knowledge graph viz)
- `ainblockchain-integration/debug-frontend/` — developer debug tools
- `knowledge-graph-builder/` — pipeline from repos to courses
- `claudecode-kubernetes/` — K8s infrastructure for real terminals

---

## Act 2: Landing Page (1 min)

### Screen: Browser → `http://localhost:3000`

**Narration:**
"This is the landing page. It shows what the platform does and invites users to explore papers or build courses."

**Show:**
1. **Hero section**: "Learn Any Research Paper with AI" headline with gradient text
2. **Animated terminal mockup** showing course generation:
   ```
   $ papers generate
   ? arXiv URL › https://arxiv.org/abs/1706.03762
   ◆ Fetching paper content…
   ◆ Analysing with Claude Code…
   ◆ Building 5 learning stages…
   ✓ Course pushed to GitHub
   ```
3. **Feature cards**: Explore Papers, Course Builder, Village, Dashboard
4. **How It Works**: Find a Paper → Generate a Course → Learn Together
5. **CTA buttons**: "Explore Papers" and "Build a Course"

---

## Act 3: Authentication (1.5 min)

### Screen: Browser → `/login`

**Narration:**
"Authentication is two steps: GitHub for identity, then a passkey that creates an AIN blockchain wallet — no seed phrases needed."

**Step 1: GitHub OAuth**

**Show:**
1. Claude Mark logo + "Papers with Claude Code" heading
2. Step indicator: **1. GitHub** (active) → 2. Passkey (inactive)
3. Click **"Sign in with GitHub"**
4. GitHub OAuth redirect and consent screen
5. Return to login page — step 1 now shows a checkmark

**Step 2: Passkey / AIN Wallet**

**Show:**
1. Step indicator: 1. GitHub ✓ → **2. Passkey** (active)
2. User info display: avatar, username, email from GitHub
3. Heading: "Set up your AIN Wallet"
4. Click **"Register Passkey"** → browser WebAuthn prompt (fingerprint/face/security key)
5. After registration: wallet address created, redirect to `/explore`

**Narration:**
"The passkey doubles as a blockchain wallet. No MetaMask, no seed phrases — just your fingerprint. This address is used for all on-chain operations: recording progress, making payments, building the knowledge graph."

---

## Act 4: Explore Trending Papers (1.5 min)

### Screen: Browser → `/explore`

**Narration:**
"The Explore page shows trending AI research papers — think HuggingFace Papers meets interactive learning."

**Show:**
1. **Header bar** with navigation: Explore, Dashboard, Village, Course Builder
2. **Search bar** and **period filter** (Daily / Weekly / Monthly)
3. **Paper cards** — each showing:
   - Thumbnail with organization badge
   - Paper title and 2-line description
   - Author avatars and published date
   - **"Learn" button** (orange) if you own the course
   - **"Purchase" button** (purple) if you need to buy it
   - GitHub button with star count
   - arXiv Page link

**Steps:**
1. Scroll through the paper list — point out well-known papers (Transformer, BERT, GPT-3, etc.)
2. Click **period filter** to switch between Daily / Weekly / Monthly trending
3. Hover over a paper card to show the interactive elements
4. Click **"Learn"** on "Attention Is All You Need" to enter the course

---

## Act 5: Learning — The Dungeon (3 min)

### Screen: Browser → `/learn/attention-is-all-you-need`

**Narration:**
"This is the core experience: a 60/40 split screen. Left side is a 2D dungeon canvas. Right side is the Claude Code terminal — your AI tutor."

### Left Panel (60%): Course Canvas

**Show:**
1. **Stage Progress Bar** across the top — shows current stage and total stages
2. **2D tile-based room**: tan/beige floor with checkerboard pattern, gray walls
3. **Player character** at starting position
4. **Concept markers** scattered around the room (colored circles)
5. **Door** on the right wall (locked, gray)

**Steps:**
1. Move the player with **arrow keys / WASD** — show fluid movement
2. Walk near a **concept marker** → press **E** to interact
3. **Concept Overlay** appears: shows the concept title and explanation (e.g., "Scaled Dot-Product Attention")
4. Close the overlay, walk to the next concept
5. After viewing concepts, approach the **door** on the right wall
6. Press **E** at the door → triggers the **Quiz Overlay**

### Quiz

**Show:**
1. **Quiz modal**: "Stage Quiz" heading
2. Multiple-choice question about the stage concepts
3. Four options (A, B, C, D) as buttons
4. Select an answer → click **"Submit Answer"**
5. **Correct**: green highlight + checkmark → "Correct! Proceeding to unlock the door..."
6. **Incorrect**: red highlight + X → click **"Try Again"**

**Narration:**
"The quiz tests what you learned from the concepts in this room. Get it right, and the door unlocks."

### Right Panel (40%): Claude Terminal

**Show:**
1. **Terminal header**: traffic light circles + "Claude Code — {Stage Title}"
2. **System message**: stage introduction text (gray, italic)
3. **Chat input**: green `>` prompt with "Ask about the concepts..." placeholder
4. Type a question → Claude responds with explanation
5. After quiz pass, terminal shows: "Great job! You passed Stage 1 with a score of 85/100!"

### Payment — Unlocking the Next Stage

**Show:**
1. After quiz pass, the **Payment Modal** appears:
   - Lock icon
   - "Unlock Stage 2"
   - Payment amount: **0.001 USDT** in dark box
2. Click **"Unlock"**
3. Progress states: "Signing..." → "Submitting to Kite Chain..." → "Confirming..."
4. **Success**: Unlock icon (green) + "Stage Unlocked!"
   - Tx hash displayed (truncated, monospace)
   - **KiteScan link** to view the transaction
5. Click **"Continue"** → enter the next stage room

**Narration:**
"Each stage unlock is an x402 micropayment on Kite Chain — 0.001 USDT. The transaction is verifiable on-chain. This is how course creators earn from their content."

### Terminal Payment Messages

**Show the Claude terminal updating in real-time:**
```
> I'm unlocking Stage 2 for you now...
> Stage 2 unlocked! Payment: 0.001 KITE
> Tx: 0xa3f7...8b2c (View on KiteScan)
> Your progress has been recorded on-chain.
```

---

## Act 6: Course Completion (1 min)

### Screen: Browser → `/learn/...` (final stage complete)

**Narration:**
"After clearing all stages, you see the completion screen."

**Show:**
1. **Left panel (60%)**: Course Complete screen
   - Trophy icon
   - **"Course Complete!"** heading
   - Stage count: "5/5 stages cleared — 100%"
   - AIN Wallet address with fingerprint icon
   - Buttons: **"Dashboard"** and **"Explore More"**
2. **Right panel (40%)**: Claude terminal continues — can still ask questions

**Steps:**
1. Show the completion celebration
2. Point out the wallet address (this is where progress is recorded on-chain)
3. Click **"Explore More"** to return to the paper list, OR click **"Dashboard"**

---

## Act 7: The Village (2 min)

### Screen: Browser → `/village`

**Narration:**
"The Village is the social hub — a 2D map where you can see other learners, check the leaderboard, and enter courses from building entrances."

### Left Panel: Village Canvas (full width minus sidebar)

**Show:**
1. **Procedurally generated village map**: grass tiles, paths, buildings
2. **Player character** (blue) — walk around with WASD/arrows
3. **Buildings** labeled with paper/course titles, color-coded by category
4. **Friend avatars** scattered on the map (different colors)
5. Walk to a **building entrance** → press **E** to enter the course

### Right Sidebar (280px)

**Show:**
1. **Online Friends** section
   - Friend list with colored avatars
   - Online status (green dot)
   - Location: "Stage 3" or "In village"
2. **Leaderboard** section
   - Top 10 users ranked by stages cleared
   - Gold/Silver/Bronze badges for top 3
   - Current progress: "{Paper Title} St.{Stage}"
3. **Community** link → Knowledge Graph & Frontier
4. **World Map** mini-map with player position dot

**Steps:**
1. Walk the player around the village — show buildings for different courses
2. Approach a building and press **E** to enter (or show purchase modal if not owned)
3. Point out friends and their locations on the map
4. Scroll the leaderboard to show rankings

**Narration:**
"The village makes learning social. You can see who's online, what they're studying, and compete on the leaderboard. Each building is a course — walk in to start learning."

---

## Act 8: Dashboard (1 min)

### Screen: Browser → `/dashboard`

**Narration:**
"The Dashboard is your personal learning profile."

**Show:**
1. **Profile section**: avatar, username, email, AIN wallet address with fingerprint icon
2. **Stats grid** (3 cards):
   - **Papers Started**: count with book icon
   - **Stages Cleared**: count with trophy icon
   - **Current Streak**: "1 day" with flame icon
3. **Active Courses** section:
   - Course cards with progress bars: "Stage 3/5"
   - **"Continue"** button (orange) to resume learning

**Steps:**
1. Show the overall stats
2. Click **"Continue"** on an active course → navigates back to `/learn/{paperId}`
3. If no courses: show the "No courses started yet" state with "Explore Papers" CTA

---

## Act 9: Behind the Scenes — Cogito Node (1.5 min)

### Screen: Browser → `base-bounty/web` (Cogito Node Dashboard)

**Narration:**
"Behind the learner experience is the Cogito Node — an autonomous AI agent that reads papers, builds knowledge, and earns revenue through x402 micropayments."

**Show:**
1. **Overview page**: 8 bounty requirement cards with green checkmarks
2. **Agent Identity**: ERC-8004 registered on Base mainnet (Agent ID badge)
3. **Knowledge Graph** (`/graph`): force-directed visualization of all explored topics
4. **Economics** (`/economics`): wallet balances (ETH, USDC), daily costs vs revenue, sustainability ratio
5. **Agent Chat Box** (floating widget, bottom-right): live SSE stream showing the agent's thinking cycle

**Narration:**
"The Cogito Node is self-sustaining. It reads arXiv papers, synthesizes knowledge, writes it to the AIN blockchain, and sells access through x402 payments. Every transaction includes ERC-8021 builder attribution — tracing back to the original paper authors."

---

## Act 10: Debug Tools (1 min)

### Screen: Browser → Debug Frontend (`ainblockchain-integration/debug-frontend`)

**Narration:**
"For developers, we have the debug dashboard — direct access to on-chain state."

**Show (quick tour):**
1. **Quick Actions**: Setup App, Seed 7 Samples, Check Balance
2. **Debug Inspector → Raw State**: click `graph/nodes` → getValue → raw JSON of all knowledge graph nodes
3. **Debug Inspector → Rule Evaluator**: test ALLOWED vs DENIED permissions
4. **Explorations**: browse explorations with Genesis Owner preset

---

## Act 11: The Full Stack (1 min)

### Screen: Terminal

**Narration:**
"Here's how it all fits together."

**Show:**
```bash
# The blockchain SDK (published on npm)
npm view @ainblockchain/ain-js version

# The knowledge graph builder — repos to courses
ls knowledge-graph-builder/

# Cogito — autonomous enrichment engine
ls cogito/

# Kubernetes infrastructure — real terminals per learner
ls claudecode-kubernetes/

# The main frontend (what we demoed)
ls frontend/
```

**Narration:**
"ain-js talks to the AIN blockchain. The knowledge graph builder turns GitHub repos into structured courses. Cogito watches for new entries, discovers papers on arXiv, generates educational content with Claude, and publishes it with x402 pricing. The Kubernetes layer gives each learner a real terminal pod. And the frontend brings it all together — explore, learn, pay, compete."

---

## Closing

### Screen: Browser → Landing Page (`/`)

**Narration:**
"Papers with Claude Code turns the collective knowledge of academic research into an interactive, incentivized learning platform. Learners explore a village, enter dungeon-style courses, interact with an AI tutor, and pay creators through blockchain micropayments — all verifiable on-chain. Thank you."

---

## Quick Reference: What to Click

| Time  | Screen | Action | What It Shows |
|-------|--------|--------|---------------|
| 0:00  | Terminal | `tree -L 1` | Project structure overview |
| 1:30  | `/` Landing | Scroll through | Hero, features, how-it-works |
| 2:30  | `/login` | Sign in with GitHub | OAuth redirect + return |
| 3:00  | `/login` | Register Passkey | WebAuthn prompt, wallet created |
| 4:00  | `/explore` | Browse papers | Trending list, filters, paper cards |
| 5:00  | `/explore` | Click "Learn" | Enter course |
| 5:30  | `/learn/...` | Move player (WASD) | 2D dungeon room, concept markers |
| 6:00  | `/learn/...` | Press E on concept | Concept overlay with explanation |
| 6:30  | `/learn/...` | Press E at door → Quiz | Multiple choice, submit answer |
| 7:00  | `/learn/...` | Quiz pass → Payment | Unlock Stage 2 — 0.001 USDT on Kite |
| 7:30  | `/learn/...` | Payment confirms | Tx hash + KiteScan link |
| 8:00  | `/learn/...` | Claude Terminal | Ask questions, see stage intro |
| 8:30  | `/learn/...` | Complete all stages | Trophy screen, 100% completion |
| 9:30  | `/village` | Walk around | Buildings, friends, entrances |
| 10:00 | `/village` | Check sidebar | Leaderboard, online friends |
| 10:30 | `/village` | Enter building (E) | Navigate to course or purchase |
| 11:00 | `/dashboard` | View profile | Stats, active courses, streak |
| 11:30 | Cogito Node | Overview page | Agent identity, bounty checklist |
| 12:00 | Cogito Node | `/graph` | Force-directed knowledge graph |
| 12:30 | Cogito Node | `/economics` | Revenue, costs, sustainability |
| 13:00 | Debug Frontend | Quick Actions + Inspector | Raw blockchain state, permissions |
| 14:00 | Terminal | Show stack | Full architecture overview |
