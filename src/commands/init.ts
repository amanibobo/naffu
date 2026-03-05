import fs from "fs/promises";
import path from "path";

const AGENTS_MD = `# Naffu Agent Instructions

> **Do not modify this file.** It contains the prompt that explains how to interact with the \`.naffu\` folder structure.

## Your role

When the user asks you to document this codebase, use Naffu to generate interactive documentation. Naffu stores everything locally in \`.naffu/\`. Think of it like [Davia](https://github.com/davialabs/davia) — interactive docs designed for coding agents.

## Commands to run first

1. **Index the codebase**: \`npx naffu index .\` — parses source files, generates Overview + module docs, builds Mermaid dependency graph
2. **Open the docs**: \`npx naffu open\` — launches the local wiki at localhost:4242

## Folder structure

\`\`\`
.naffu/
├── AGENTS.md          # This file - do not modify
├── llms.txt           # Doc index for agents (fetch before exploring)
├── assets/            # HTML pages (optional, for custom layouts)
├── data/              # JSON data (graphs, tables)
├── mermaids/          # .mmd files — Mermaid diagrams (rendered in UI)
├── docs/              # Auto-generated + agent-created doc pages
├── tools/             # graph.js, doc.js
├── index.json         # Codebase index
└── graph.json         # Dependency graph (includes mermaid field)
\`\`\`

## How to create documentation

### 1. Mermaid diagrams (flowcharts, architecture)

Write \`.mmd\` files to \`.naffu/mermaids/<name>.mmd\`. The UI renders these.

### 2. Doc pages (markdown)

Create \`.naffu/docs/<slug>.json\` with \`{ "title", "slug", "content" }\`. Add to \`.naffu/docs/index.json\` pages array.

### 3. Data tables

JSON files in \`.naffu/data/\` with top-level arrays become tables.

## Example prompts for the user

- **Broad**: "Document this project. Use Naffu to generate the wiki."
- **Focused**: "Using Naffu, document only the schemas/classes."
- **Diagram**: "Document the auth flow with a Mermaid diagram in .naffu/mermaids/"
`;

const CURSOR_RULE = `---
description: Naffu documentation agent - use when user asks to document the codebase
globs: ["**/*"]
---

# Naffu Documentation

When the user asks you to document this project, use Naffu:

1. Run \`npx naffu index .\` to index the codebase and generate docs
2. Read \`.naffu/AGENTS.md\` for full instructions
3. Create Mermaid diagrams in \`.naffu/mermaids/\`
4. Create doc pages in \`.naffu/docs/\` as JSON with title, slug, content (markdown)
5. Run \`npx naffu open\` to view the wiki

Do not modify \`.naffu/AGENTS.md\`.
`;

export type AgentType = "cursor" | "claude-code" | "github-copilot" | "windsurf" | "open-code";

const AGENT_CONFIG: Record<
  AgentType,
  { rulesDir: string; ruleFile: string; gitignore?: string }
> = {
  cursor: { rulesDir: ".cursor/rules", ruleFile: "naffu.mdc", gitignore: ".cursor/rules" },
  "claude-code": { rulesDir: ".claude", ruleFile: "naffu.md", gitignore: ".claude" },
  "github-copilot": { rulesDir: ".github/copilot", ruleFile: "naffu.md", gitignore: ".github/copilot" },
  windsurf: { rulesDir: ".windsurf", ruleFile: "naffu.md", gitignore: ".windsurf" },
  "open-code": { rulesDir: ".opencode", ruleFile: "naffu.md", gitignore: ".opencode" },
};

export async function initWorkspace(cwd: string, agent?: AgentType): Promise<{ agentRule?: string }> {
  const naffuDir = path.join(cwd, ".naffu");
  const toolsDir = path.join(naffuDir, "tools");
  const assetsDir = path.join(naffuDir, "assets");
  const dataDir = path.join(naffuDir, "data");
  const mermaidsDir = path.join(naffuDir, "mermaids");

  await fs.mkdir(naffuDir, { recursive: true });
  await fs.mkdir(toolsDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(mermaidsDir, { recursive: true });

  await fs.writeFile(path.join(naffuDir, "AGENTS.md"), AGENTS_MD);

  await fs.writeFile(
    path.join(naffuDir, "workspace.json"),
    JSON.stringify(
      {
        repos: [path.relative(process.cwd(), cwd) || "."],
        indexedAt: new Date().toISOString(),
        agentTools: {
          analyzeRepo: "npx naffu index .",
          generateGraph: "node .naffu/tools/graph.js",
          createDocPage: "node .naffu/tools/doc.js",
        },
      },
      null,
      2
    )
  );

  // Copy tool scripts
  const toolsSource = path.resolve(__dirname, "..", "..", "tools");
  try {
    const graphJs = await fs.readFile(path.join(toolsSource, "graph.js"), "utf-8");
    const docJs = await fs.readFile(path.join(toolsSource, "doc.js"), "utf-8");
    await fs.writeFile(path.join(toolsDir, "graph.js"), graphJs);
    await fs.writeFile(path.join(toolsDir, "doc.js"), docJs);
  } catch {
    // Fallback stubs
    await fs.writeFile(
      path.join(toolsDir, "graph.js"),
      `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const naffuDir = path.join(process.cwd(), ".naffu");
fs.mkdirSync(naffuDir, { recursive: true });
fs.writeFileSync(path.join(naffuDir, "graph.json"), JSON.stringify({ nodes: [], edges: [], mermaid: "flowchart LR\\n  A[No index]" }, null, 2));
console.log("Graph generated");
`
    );
    await fs.writeFile(
      path.join(toolsDir, "doc.js"),
      `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const title = process.argv[2] || "Untitled";
const naffuDir = path.join(process.cwd(), ".naffu");
const docsDir = path.join(naffuDir, "docs");
fs.mkdirSync(docsDir, { recursive: true });
const slug = title.toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const doc = { title, slug, content: "", updatedAt: new Date().toISOString() };
fs.writeFileSync(path.join(docsDir, slug + ".json"), JSON.stringify(doc, null, 2));
console.log("Doc created:", slug + ".json");
`
    );
  }

  // Agent-specific rules (Davia-style)
  let agentRule: string | undefined;
  if (agent && AGENT_CONFIG[agent]) {
    const config = AGENT_CONFIG[agent];
    const rulesPath = path.join(cwd, config.rulesDir);
    await fs.mkdir(rulesPath, { recursive: true });
    await fs.writeFile(path.join(rulesPath, config.ruleFile), CURSOR_RULE);
    agentRule = `${config.rulesDir}/${config.ruleFile}`;
  }

  // Add .naffu to .gitignore
  const gitignorePath = path.join(cwd, ".gitignore");
  try {
    let content = await fs.readFile(gitignorePath, "utf-8");
    if (!content.includes(".naffu")) {
      content = content.trimEnd() + "\n\n# Naffu (local docs)\n.naffu\n";
      await fs.writeFile(gitignorePath, content);
    }
  } catch {
    await fs.writeFile(gitignorePath, "# Naffu (local docs)\n.naffu\n");
  }

  return { agentRule };
}
