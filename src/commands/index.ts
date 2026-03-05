import fs from "fs/promises";
import path from "path";
import { parseSource } from "../core/parser";

interface FileEntry {
  path: string;
  type: "file" | "dir";
  size?: number;
  imports?: { specifier: string; resolved?: string; names: string[] }[];
  exports?: { name: string; kind: string }[];
}

const SOURCE_EXTS = new Set([".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"]);
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".naffu",
  "coverage",
]);

function resolveImport(
  root: string,
  fromFilePath: string,
  specifier: string,
  filePaths: string[]
): string | undefined {
  const fromDir = path.dirname(path.join(root, fromFilePath));
  const candidates = [
    specifier,
    specifier + ".ts",
    specifier + ".tsx",
    specifier + ".js",
    specifier + ".jsx",
    path.join(specifier, "index.ts"),
    path.join(specifier, "index.tsx"),
    path.join(specifier, "index.js"),
  ];
  for (const c of candidates) {
    const absTarget = path.normalize(path.join(fromDir, c));
    for (const fp of filePaths) {
      const absFile = path.normalize(path.join(root, fp));
      const absFileNoExt = absFile.replace(/\.(tsx?|jsx?|mjs|cjs)$/, "");
      if (absTarget === absFile || absTarget === absFileNoExt) return fp;
    }
  }
  return undefined;
}

export async function indexRepo(repoPath: string) {
  const cwd = process.cwd();
  const targetPath = path.resolve(cwd, repoPath);
  const naffuDir = path.join(targetPath, ".naffu");
  const docsDir = path.join(naffuDir, "docs");

  await fs.mkdir(naffuDir, { recursive: true });
  await fs.mkdir(docsDir, { recursive: true });

  const entries: FileEntry[] = [];
  const fileMap = new Map<string, string>();

  async function walk(dir: string, base = "") {
    let items: string[];
    try {
      items = await fs.readdir(dir);
    } catch {
      return;
    }

    for (const item of items) {
      if (IGNORE_DIRS.has(item)) continue;

      const fullPath = path.join(dir, item);
      const relPath = path.join(base, item).replace(/\\/g, "/");

      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          entries.push({ path: relPath, type: "dir" });
          await walk(fullPath, relPath);
        } else {
          const ext = path.extname(item);
          const entry: FileEntry = {
            path: relPath,
            type: "file",
            size: stat.size,
          };
          if (SOURCE_EXTS.has(ext)) {
            try {
              const code = await fs.readFile(fullPath, "utf-8");
              const parsed = parseSource(code);
              entry.imports = parsed.imports.map((i) => ({
                specifier: i.specifier,
                names: i.names,
              }));
              entry.exports = parsed.exports;
              fileMap.set(relPath, relPath);
            } catch {
              // Parse failed, keep basic entry
            }
          }
          entries.push(entry);
        }
      } catch {
        // Skip inaccessible
      }
    }
  }

  await walk(targetPath);

  // Resolve imports to file paths
  const sourcePaths = [...fileMap.keys()];
  for (const e of entries) {
    if (e.imports && e.type === "file") {
      for (const imp of e.imports) {
        if (imp.specifier.startsWith(".")) {
          const resolved = resolveImport(targetPath, e.path, imp.specifier, sourcePaths);
          if (resolved) (imp as { resolved?: string }).resolved = resolved;
        }
      }
    }
  }

  const index = {
    indexedAt: new Date().toISOString(),
    root: targetPath,
    files: entries,
  };

  await fs.writeFile(
    path.join(naffuDir, "index.json"),
    JSON.stringify(index, null, 2)
  );

  // Generate docs from codebase
  await generateDocs(targetPath, entries, docsDir, naffuDir);

  // Generate dependency graph (Mermaid)
  const { spawn } = await import("child_process");
  const graphJs = path.join(naffuDir, "tools", "graph.js");
  try {
    const { existsSync } = await import("fs");
    if (existsSync(graphJs)) {
      await new Promise<void>((resolve, reject) => {
        const proc = spawn("node", [graphJs], { cwd: targetPath, stdio: "pipe" });
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`graph.js exited ${code}`))));
      });
    }
  } catch {
    // Graph tool may not exist yet
  }

  // Scan mermaids/ for agent-created .mmd files
  const mermaidsDir = path.join(naffuDir, "mermaids");
  try {
    const { existsSync } = await import("fs");
    if (existsSync(mermaidsDir)) {
      const items = await fs.readdir(mermaidsDir);
      const mmdFiles = items.filter((f) => f.endsWith(".mmd"));
      await fs.writeFile(
        path.join(mermaidsDir, "index.json"),
        JSON.stringify({ files: mmdFiles }, null, 2)
      );
    }
  } catch {
    // Ignore
  }

  // Source count available for CLI to display
}

async function generateDocs(
  root: string,
  entries: FileEntry[],
  docsDir: string,
  naffuDir: string
) {
  const allFiles = entries.filter((e) => e.type === "file");
  const sourceFiles = allFiles.filter(
    (e) => e.exports?.length || e.imports?.length
  );

  const docsIndex = { pages: [] as { title: string; slug: string }[] };

  // Categorize files for "Relevant source files"
  const configFiles = allFiles.filter(
    (f) =>
      f.path.match(/^(package\.json|tsconfig|\.github|\.circleci|Makefile|pyproject|setup\.(py|cfg)|Cargo\.toml)/) ||
      f.path.endsWith("config.yml") ||
      f.path.endsWith("config.yaml")
  );
  const docFiles = allFiles.filter(
    (f) =>
      f.path.startsWith("docs/") ||
      f.path.endsWith(".md") ||
      f.path.endsWith(".mdx")
  );
  const srcFiles = allFiles.filter((f) => f.path.startsWith("src/"));
  const testFiles = allFiles.filter(
    (f) => f.path.startsWith("test") || f.path.includes("/test")
  );
  const utilFiles = allFiles.filter((f) => f.path.startsWith("utils/"));
  const toolFiles = allFiles.filter(
    (f) => f.path.startsWith("tools/") || f.path.startsWith("scripts/")
  );
  const otherFiles = allFiles.filter(
    (f) =>
      !configFiles.includes(f) &&
      !docFiles.includes(f) &&
      !srcFiles.includes(f) &&
      !testFiles.includes(f) &&
      !utilFiles.includes(f) &&
      !toolFiles.includes(f)
  );

  // Exclude lock files, binary docs, etc. from relevant files
  const excludeFromRelevant = (p: string) =>
    /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml?)$/.test(p) ||
    /\.(docx?|xlsx?|pdf)$/i.test(p);

  const relevantFiles = [
    ...configFiles,
    ...docFiles,
    ...toolFiles,
    ...srcFiles,
    ...utilFiles,
    ...testFiles,
    ...otherFiles,
  ]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((f) => f.path)
    .filter((p) => !excludeFromRelevant(p));

  // Extract purpose from package.json
  let purpose = "";
  try {
    const pkg = JSON.parse(
      await fs.readFile(path.join(root, "package.json"), "utf-8")
    );
    purpose = pkg.description || "";
  } catch {}
  if (!purpose) {
    try {
      const readme = await fs.readFile(path.join(root, "README.md"), "utf-8");
      const firstPara = readme.split(/\n\n+/)[1] || readme.split("\n")[1] || "";
      purpose = firstPara.slice(0, 300).trim();
    } catch {}
  }

  // Build source layout tree
  const tree = new Map<string, { dirs: string[]; files: string[] }>();
  for (const f of allFiles) {
    const parts = f.path.split("/");
    for (let i = 0; i < parts.length; i++) {
      const parent = parts.slice(0, i).join("/");
      const name = parts[i];
      if (!tree.has(parent)) tree.set(parent, { dirs: [], files: [] });
      const node = tree.get(parent)!;
      if (i === parts.length - 1) {
        if (!node.files.includes(name)) node.files.push(name);
      } else {
        if (!node.dirs.includes(name)) node.dirs.push(name);
      }
    }
  }
  function buildTree(parent: string, prefix: string): string[] {
    const lines: string[] = [];
    const node = tree.get(parent);
    if (!node) return lines;
    const dirs = [...node.dirs].sort();
    const files = [...node.files].sort();
    const all = dirs.map((d) => ({ n: d, isDir: true })).concat(files.map((f) => ({ n: f, isDir: false })));
    all.forEach(({ n, isDir }, i) => {
      const isLast = i === all.length - 1;
      const branch = isLast ? "└── " : "├── ";
      const label = isDir ? n + "/" : n;
      lines.push(prefix + branch + label);
      if (isDir) {
        const childPath = parent ? parent + "/" + n : n;
        lines.push(...buildTree(childPath, prefix + (isLast ? "    " : "│   ")));
      }
    });
    return lines;
  }
  const treeLines = buildTree("", "");
  const sourceLayout = treeLines.length > 0 ? "```\n" + treeLines.join("\n") + "\n```" : "```\n" + relevantFiles.slice(0, 15).join("\n") + "\n```";

  // Subsystem summary table
  const subsystemRows = sourceFiles.map((f) => {
    const exports = (f.exports || []).map((e) => e.name).join(", ") || "—";
    return `| ${f.path} | ${exports} |`;
  });

  const overviewMd = [
    "# Overview",
    "",
    "## Relevant source files",
    "",
    ...relevantFiles.map((f) => `- \`${f}\``),
    "",
    "---",
    "",
    "This page describes the purpose, scope, high-level architecture, and organization of the codebase.",
    "",
    "## Purpose",
    "",
    purpose || "_No description found. Add a `description` to package.json or README.md._",
    "",
    "## Source layout",
    "",
    sourceLayout,
    "",
    "## Subsystem summary",
    "",
    "| Module | Key exports |",
    "|--------|-------------|",
    ...subsystemRows,
    "",
    "## Dependency graph",
    "",
    "See the **Graph** view for the Mermaid diagram.",
    "",
    `_Generated at ${new Date().toISOString()}_`,
  ].join("\n");

  const overviewSlug = "overview";
  await fs.writeFile(
    path.join(docsDir, overviewSlug + ".json"),
    JSON.stringify(
      {
        title: "Overview",
        slug: overviewSlug,
        content: overviewMd,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  docsIndex.pages.push({ title: "Overview", slug: overviewSlug });

  // Per-file docs (flatten path to avoid nested dirs)
  for (const f of sourceFiles) {
    const slug =
      (f.path
        .replace(/\.[^.]+$/, "")
        .replace(/\//g, "-")
        .replace(/[^a-z0-9-]/gi, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "")
        .replace(/-+/g, "-")
        .toLowerCase()) || "module";
    const exportsList = (f.exports || [])
      .map((e) => `- \`${e.name}\` (${e.kind})`)
      .join("\n");
    const importsList = (f.imports || [])
      .filter((i) => (i as { resolved?: string }).resolved)
      .map((i) => `- ${(i as { resolved?: string }).resolved} (${i.names.join(", ")})`)
      .join("\n");

    const md = [
      `# ${f.path}`,
      "",
      "## Exports",
      "",
      exportsList || "_None_",
      "",
      "## Imports",
      "",
      importsList || "_None_",
      "",
    ].join("\n");

    const safeSlug = slug || "module-" + f.path.replace(/\//g, "-");
    await fs.writeFile(
      path.join(docsDir, safeSlug + ".json"),
      JSON.stringify(
        {
          title: f.path,
          slug: safeSlug,
          content: md,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    if (!docsIndex.pages.find((p) => p.slug === safeSlug)) {
      docsIndex.pages.push({ title: f.path, slug: safeSlug });
    }
  }

  await fs.writeFile(
    path.join(docsDir, "index.json"),
    JSON.stringify(docsIndex, null, 2)
  );

  // llms.txt - doc index for agents (Davia-style discoverability)
  const baseUrl = "http://localhost:4242";
  const llmsLines = [
    "# Naffu",
    "",
    "> Fetch this file to discover all docs. Base URL: " + baseUrl,
    "",
    "## Docs",
    "",
    ...docsIndex.pages.map((p) => `- [${p.title}](${baseUrl}/docs/${p.slug}.json)`),
    "",
    "## Graph",
    "",
    `- [Dependency Graph](${baseUrl}/graph.json)`,
    "",
    "## Index",
    "",
    `- [Codebase Index](${baseUrl}/index.json)`,
  ];
  await fs.writeFile(path.join(naffuDir, "llms.txt"), llmsLines.join("\n"));
}
