#!/usr/bin/env node
// Naffu dependency graph generator - outputs Mermaid.js
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();
const naffuDir = path.join(cwd, ".naffu");
const indexPath = path.join(naffuDir, "index.json");

let nodes = [];
let edges = [];
let mermaid = "";

try {
  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const files = (index.files || []).filter((f) => f.type === "file" && (f.imports || f.exports));

  const nodeIds = new Map();
  files.forEach((f, i) => {
    const id = "F" + i;
    nodeIds.set(f.path, id);
    nodes.push({ id, label: f.path, path: f.path });
  });

  for (const f of files) {
    const fromId = nodeIds.get(f.path);
    if (!fromId) continue;
    for (const imp of f.imports || []) {
      const resolved = imp.resolved;
      if (resolved && nodeIds.has(resolved)) {
        const toId = nodeIds.get(resolved);
        if (toId && toId !== fromId) {
          edges.push({ from: fromId, to: toId });
        }
      }
    }
  }

  // Dedupe edges
  const seen = new Set();
  edges = edges.filter((e) => {
    const key = e.from + "->" + e.to;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Build Mermaid flowchart (sanitize labels for Mermaid)
  const lines = ["flowchart LR"];
  for (const n of nodes) {
    const safe = n.id.replace(/-/g, "_");
    const label = n.label.replace(/"/g, "'").replace(/\[/g, "(").replace(/\]/g, ")");
    lines.push(`  ${safe}["${label}"]`);
  }
  for (const e of edges) {
    lines.push(`  ${e.from} --> ${e.to}`);
  }
  mermaid = lines.join("\n");
} catch (err) {
  mermaid = "flowchart LR\n  A[No index yet]";
}

fs.mkdirSync(naffuDir, { recursive: true });
const mermaidsDir = path.join(naffuDir, "mermaids");
fs.mkdirSync(mermaidsDir, { recursive: true });
fs.writeFileSync(
  path.join(naffuDir, "graph.json"),
  JSON.stringify({ nodes, edges, mermaid }, null, 2)
);
fs.writeFileSync(path.join(naffuDir, "graph.mmd"), mermaid);
fs.writeFileSync(path.join(mermaidsDir, "dependency-graph.mmd"), mermaid);
console.log("Graph generated: .naffu/graph.json, .naffu/mermaids/dependency-graph.mmd");
