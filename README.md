# Papers with Claude Code

A knowledge graph-based learning platform that connects academic papers and GitHub repositories for educational content, enabling a shared learning management system with friends.

## Overview

This project builds a knowledge graph to link research papers, code repositories, and learning resources together. By mapping relationships between concepts, papers, and implementations, it creates an interconnected learning experience that goes beyond traditional reading lists.

## Features

- **Knowledge Graph Construction** - Automatically extract and connect key concepts, methods, and findings across papers
- **Paper-to-Code Linking** - Map academic papers to their corresponding GitHub repositories and implementations
- **Shared Learning Management** - Collaborate with friends to track reading progress, share annotations, and discuss insights
- **Educational Content Curation** - Organize papers and repos into structured learning paths
- **Social Learning** - Share knowledge graphs with peers, compare notes, and learn together

## Roles & Responsibilities

| Member | Module |
|--------|--------|
| @chanho | `frontend/` |
| @haechan | `claudecode-kubernetes/` |
| @hyeonjeong | `knowledge-graph-builder/` |
| @minhyun | `ainblockchain-integration/` |

## Getting Started

1. **Set up GitHub OAuth** — See [docs/github-login.md](docs/github-login.md) for full setup instructions
2. **Run the frontend** — `cd frontend && npm install && npm run dev`
3. **Generate a course** — `cd knowledge-graph-builder && python3 -m kg_extractor pipeline --repo <repo-url> --output <output-dir>`
4. **Learn with Claude Code** — `cd <output-dir> && claude`

## Documentation

- [GitHub Login (Passkey Auth)](docs/github-login.md) — GitHub OAuth + P256 passkey wallet for frontend, KG extractor, and Kubernetes CI/CD

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
