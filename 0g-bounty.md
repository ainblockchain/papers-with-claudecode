# Papers with Claude Code — 0G Bounty ($4,000)

> Best Developer Tooling or Education

**Live**: [paperswithclaudecode.com](https://paperswithclaudecode.com) — find the 0G course, enter the 2D RPG, learn with Claude Code as your tutor.

## What We Built

We turned 0G's 19,000-line documentation into two interactive learning courses that run on [paperswithclaudecode.com](https://paperswithclaudecode.com). Learners don't read docs — they walk through a 2D dungeon as a Space Panda astronaut, interact with concept markers, answer quizzes, and ask Claude Code questions in a live terminal. The AI tutor is pre-loaded with 0G-specific knowledge: SDK patterns, contract addresses, network configs, and the five most common beginner mistakes.

The courses are open source, immediately runnable, and designed to get a developer from zero to their first 0G Storage upload in five minutes.

## Two Course Tracks

**0G Basic Course** is for developers with no blockchain experience. Three modules, twelve concepts, fifteen prerequisite edges in a knowledge graph. It starts with "What is 0G?" using plain-language analogies, walks through wallet setup and MetaMask configuration, then builds to a first file upload, a first AI inference, and a full storage-compute pipeline. Every lesson includes a key idea, a code example, a common mistake warning, and a multiple-choice exercise.

**0G Developer Course** is for Web2 and Ethereum developers building production apps. Five modules, twenty-five concepts, thirty-two dependency edges. It covers the Storage SDK in depth (both Log and KV layers), the Compute Network's six-step CLI setup, smart contract deployment with the required `evmVersion: 'cancun'` flag, and advanced patterns like ERC-7857, Goldsky indexing, and rollup integration.

## How the AI Tutor Works

Each course includes a `CLAUDE.md` file that configures Claude Code as a domain-specific tutor. It contains:

- Network configs for both testnet (Galileo, chainId 16602) and mainnet (Aristotle, chainId 16661) with RPC endpoints, explorer URLs, and contract addresses
- SDK quick reference for ZgFile, Indexer, KvClient, and OpenAI-compatible inference
- The six-step Compute CLI setup sequence (login, deposit, list-providers, transfer-fund, acknowledge, get-secret) — consolidated from scattered docs into one ordered list
- Five diagnosed beginner mistakes: not saving rootHash, wrong network in MetaMask, committing .env files, skipping provider acknowledgement, missing evmVersion flag

The tutor follows a teaching methodology: plain English first, then why it matters, then show code, then call out the common mistake, then quiz. It's patient, encouraging, and practical.

## What Friction Points It Solves

The `evmVersion: 'cancun'` requirement is buried deep in the official docs. Developers hit a cryptic deployment error and don't know why. Our course highlights it with a REQUIRED warning in the smart contract module and the tutor diagnoses it automatically when a learner asks for help.

The Compute CLI setup is scattered across multiple doc pages. We consolidated the six steps into a single ordered sequence in both the course content and the tutor configuration. A learner can follow it linearly without jumping between pages.

The difference between the Storage Indexer URL and the RPC URL confuses beginners — they look similar but serve different purposes. Every code example in the course explicitly separates them, and the `.env.example` files label each one clearly.

The rootHash from a storage upload must be saved immediately — it's the only way to retrieve the file later. The course calls this out as the number one beginner mistake and shows it in every upload example.

## How It Integrates with the Platform

The 0G courses appear on [paperswithclaudecode.com/explore](https://paperswithclaudecode.com) as course cards with a space-themed background. When a learner clicks Learn, they enter a 60/40 split screen: the left side is a 2D dungeon with a Space Panda character walking on a purple planet surface with glowing cyan portals. The right side is a Claude Code terminal with the 0G tutor loaded.

Learners navigate concepts, read lessons, answer quizzes, and unlock stages with x402 micropayments. Progress is recorded on the AIN blockchain knowledge graph. The knowledge graph tracks prerequisite relationships, so the platform knows which concepts a learner has mastered and which they should tackle next.

## Open Source and Reusable

The course format is a reusable pattern. Any protocol can create a course by providing:

- `paper.json` — metadata for the platform card
- `knowledge/graph.json` — concepts and prerequisite edges
- `knowledge/courses.json` — lesson content with exercises
- `CLAUDE.md` — tutor configuration with domain facts

This is not a one-off tutorial. It's a template that other protocols can fork to create their own interactive courses on [paperswithclaudecode.com](https://paperswithclaudecode.com).

## Quick Start

**Path A — Use the AI tutor locally:**
```bash
cd 0G/0g-basic-course
claude    # Opens Claude Code with the 0G tutor loaded
```
Ask: "Walk me through Module 1" or "Help me upload my first file to 0G Storage."

**Path B — Experience the platform:**
Visit [paperswithclaudecode.com](https://paperswithclaudecode.com), find the 0G course, and enter the 2D RPG.

## Why This Fits the Bounty

This is education that solves real developer friction. It doesn't just document the APIs — it diagnoses the five most common mistakes, consolidates scattered setup sequences, and provides a live AI tutor that knows 0G's contract addresses, SDK patterns, and network configs by heart.

It's open source, well-documented, and immediately helpful. The course format is reusable — other teams can adopt the same `graph.json` + `courses.json` + `CLAUDE.md` pattern to create courses for their own protocols.

And it runs on a live platform at [paperswithclaudecode.com](https://paperswithclaudecode.com) where learners can start learning 0G right now, with Claude Code guiding them step by step.
