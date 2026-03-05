#!/usr/bin/env node
// Naffu doc page creator - run by agent: node .naffu/tools/doc.js "Page Title"
const fs = require("fs");
const path = require("path");

const title = process.argv[2] || "Untitled";
const cwd = process.cwd();
const naffuDir = path.join(cwd, ".naffu");
const docsDir = path.join(naffuDir, "docs");

fs.mkdirSync(docsDir, { recursive: true });
const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const doc = {
  title,
  slug,
  content: "",
  updatedAt: new Date().toISOString(),
};
fs.writeFileSync(
  path.join(docsDir, slug + ".json"),
  JSON.stringify(doc, null, 2)
);
// Update docs index
const indexPath = path.join(docsDir, "index.json");
let index = { pages: [] };
try {
  index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
} catch {}
if (!index.pages.find((p) => p.slug === slug)) {
  index.pages.push({ title, slug });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}
console.log("Doc page created:", slug + ".json");
