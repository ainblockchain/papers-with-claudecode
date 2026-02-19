# Transformer Learning Path

A Claude Code-powered interactive learning path for transformer architectures,
with on-chain progress tracking via the AIN blockchain.

## Requirements

- [Claude Code](https://claude.com/claude-code)
- Node.js >= 16 (for blockchain helper)

## Getting Started

1. Clone this repo
2. Open Claude Code in this directory:
   ```
   cd test-course/
   claude
   ```
3. Set up your blockchain wallet (first time only):
   ```
   setup wallet
   ```
4. Start learning — just chat naturally:
   ```
   explore              # see the knowledge graph
   teach me attention   # start your first lesson
   give me a challenge  # get a hands-on exercise
   done                 # mark complete + record on-chain
   ```

## On-Chain Features

Your learning progress is recorded on the AIN blockchain. This enables:

- **Global discovery**: See who else is exploring the same topics.
- **Frontier map**: View community-wide stats per topic.
- **Premium content**: Some advanced lessons use x402 payment gating.

### Setup

```bash
cd blockchain
npm install
node ain-helper.js setup    # creates wallet, outputs your address
```

### Explorers (Friends)

Instead of git branches, friends are discovered on-chain:
```
explorers               # who else is learning this concept?
frontier                # community stats per topic
```

## Course Structure

- **Transformer Foundations** (3 concepts): Core concepts every transformer practitioner must understand
- **Encoder Models (BERT Family)** (6 concepts): Understanding bidirectional transformers and their applications
- **Decoder Models (GPT Family)** (4 concepts): Autoregressive language models from GPT to modern LLMs
- **Sequence-to-Sequence Models** (1 concepts): Encoder-decoder architectures for translation and generation
- **Efficiency & Optimization** (13 concepts): Making transformers faster and smaller
- **Frontier Models & Techniques** (6 concepts): Cutting-edge architectures and emerging paradigms

## Stats

- 33 concepts across 6 courses
- 3 foundational, 8 intermediate, 16 advanced, 6 frontier concepts
