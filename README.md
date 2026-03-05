# Naffu

**DeepWiki Generator for AI Coding Agents** 

Cursor · Claude Code · GitHub Copilot · Windsurf · Open Code

by Amani Bobo · MIT License

## What is Naffu?

Naffu is a local-first documentation engine for agentic coding. It works alongside AI coding agents to automatically analyze your codebase, generate interactive documentation, build Mermaid dependency graphs, and power Q&A—all stored locally in `.naffu/`.

## Quick Start

```bash
# 1. Initialize (link to your agent)
naffu init --agent=cursor

# 2. Index & generate docs
naffu index .

# 3. Open the wiki
naffu open
```

Then ask your agent: **"Document this project. Use Naffu to generate the wiki."**

## CLI Commands

| Command | Description |
|---------|-------------|
| `naffu init [--agent=]` | Initialize workspace. Use `--agent=cursor`, `claude-code`, `github-copilot`, `windsurf`, or `open-code` to add agent rules |
| `naffu index [path]` | Parse source, generate docs, build Mermaid graph |
| `naffu open` | Launch docs UI at localhost:4242 |
| `naffu config` | Interactive model/API key wizard |

## .naffu Folder Structure

```
.naffu/
├── AGENTS.md          # Agent instructions (do not modify)
├── llms.txt           # Doc index for agents (fetch before exploring)
├── assets/            # HTML pages (optional)
├── data/              # JSON data
├── mermaids/          # .mmd files — Mermaid diagrams
├── docs/              # Auto-generated + agent-created pages
├── tools/             # graph.js, doc.js
├── index.json         # Codebase index
└── graph.json         # Dependency graph
```

## Example Prompts for Your Agent

- **Broad**: "Document this project. Use Naffu to generate the wiki."
- **Focused**: "Using Naffu, document only the schemas/classes. Include name, description, main fields."
- **Diagram**: "Document the auth flow with a Mermaid diagram. Create a file in .naffu/mermaids/"

## Installation

```bash
npm install -g naffu
```

Or use without installing:

```bash
npx naffu init --agent=cursor
npx naffu index .
npx naffu open
```

## License

MIT
