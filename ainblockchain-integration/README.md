# AI Network Blockchain Integration

Integration layer with the AI Network blockchain for on-chain learning progress, explorer discovery, and decentralized collaboration.

## How it works

Generated courses use the [AIN blockchain](https://ainetwork.ai/) Knowledge module to:

- **Track progress on-chain**: Each concept completion is recorded via `ain.knowledge.explore()`
- **Discover explorers**: See who else has explored each topic via `ain.knowledge.getExplorers()`
- **Frontier map**: Community-wide stats per topic (explorer count, max depth, avg depth)
- **x402 payment gating**: Premium lessons can require on-chain payment via `ain.knowledge.access()`

## Architecture

The course repo contains **no helper scripts** — the tutor (Claude Code) calls ain-js directly via inline `node -e` commands. The only blockchain file in the course repo is `blockchain/config.json`:

```json
{
  "provider_url": "http://localhost:8081",
  "topic_map": { "concept_id": "transformers/foundations/concept_id" },
  "depth_map": { "concept_id": 1 },
  "ain_js_path": "/path/to/ain-js/lib/ain.js"
}
```

### Key ain-js Knowledge API

| Method | Description |
|--------|-------------|
| `ain.knowledge.explore(input)` | Record exploration (topicPath, title, content, summary, depth, tags) |
| `ain.knowledge.getExplorers(topicPath)` | List addresses that explored a topic |
| `ain.knowledge.getExplorations(address, topicPath)` | Get explorations by a specific user |
| `ain.knowledge.getFrontierMap(topicPrefix)` | Per-topic stats (explorer_count, max_depth, avg_depth) |
| `ain.knowledge.getTopicStats(topicPath)` | Stats for a single topic |
| `ain.knowledge.access(owner, topicPath, entryId)` | Access gated content (x402 payment) |

### Inline command pattern

All blockchain calls follow this pattern in `CLAUDE.md`:

```bash
node -e "
  const Ain = require(require('./blockchain/config.json').ain_js_path).default;
  const cfg = require('./blockchain/config.json');
  const ain = new Ain(cfg.provider_url);
  const fs = require('fs');
  const pk = fs.readFileSync('blockchain/.env','utf-8').match(/AIN_PRIVATE_KEY=(.+)/)[1].trim();
  ain.wallet.addAndSetDefaultAccount(pk);
  ain.knowledge.explore({
    topicPath: cfg.topic_map['concept_id'],
    title: 'Title', content: 'Content', summary: 'Summary',
    depth: cfg.depth_map['concept_id'] || 1, tags: 'concept_id'
  }).then(r => console.log(JSON.stringify(r)));
"
```

## Learner flow

1. Learner opens Claude Code in a generated course repo
2. Tutor runs wallet setup → private key saved to `blockchain/.env`
3. Learner completes a quiz → tutor records on-chain via `ain.knowledge.explore()`
4. Learner says "friends" → tutor queries `ain.knowledge.getExplorers()`
5. Learner says "frontier" → tutor queries `ain.knowledge.getFrontierMap()`

## Example course

The `example-course/` directory contains a fully generated Transformer course with blockchain integration:

```
example-course/
├── CLAUDE.md              # Tutor instructions with ain-js API
├── README.md              # Learner setup guide
├── .gitignore
├── .learner/
│   └── profile.json       # Learner profile (wallet_address)
├── blockchain/
│   └── config.json        # Topic map, depth map, provider URL
└── knowledge/
    ├── graph.json          # 33-node knowledge graph
    └── courses.json        # 6 courses, 33 lessons
```

## Requirements

- Node.js >= 16
- Local [ain-js](https://github.com/ainblockchain/ain-js) build with Knowledge module
- AIN blockchain node (local or testnet)

## Enabling blockchain in kg-extractor

```bash
python3 -m kg_extractor pipeline \
  --repo /path/to/source-repo \
  --output /path/to/course \
  --enable-blockchain
```

See [knowledge-graph-builder](../knowledge-graph-builder/) for the full pipeline.
