/**
 * Lightweight regex-based parser for JS/TS to extract imports and exports.
 */

export interface ParsedFile {
  imports: { specifier: string; names: string[]; isDefault?: boolean }[];
  exports: { name: string; kind: "function" | "class" | "const" | "let" | "var" | "default" }[];
}

const IMPORT_RE =
  /import\s+(?:(\w+)\s+from\s+)?(?:[\{]([^}]+)[\}]|(\*)\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]|import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
const EXPORT_DEFAULT_RE = /export\s+default\s+(\w+)/g;
const EXPORT_FN_RE = /export\s+(?:async\s+)?function\s+(\w+)/g;
const EXPORT_CLASS_RE = /export\s+class\s+(\w+)/g;
const EXPORT_VAR_RE = /export\s+(?:const|let|var)\s+(\w+)/g;

export function parseSource(code: string): ParsedFile {
  const imports: ParsedFile["imports"] = [];
  const exports: ParsedFile["exports"] = [];

  let m: RegExpExecArray | null;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(code)) !== null) {
    const specifier = m[5] || m[8];
    if (!specifier) continue;
    // Only include relative imports for dependency graph
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) continue;

    if (m[2]) {
      imports.push({
        specifier,
        names: m[2].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()!.trim()),
      });
    } else if (m[4]) {
      imports.push({ specifier, names: [m[4]], isDefault: false });
    } else {
      imports.push({ specifier, names: [m[1] || m[7] || "default"], isDefault: true });
    }
  }

  EXPORT_DEFAULT_RE.lastIndex = 0;
  while ((m = EXPORT_DEFAULT_RE.exec(code)) !== null) {
    exports.push({ name: m[1], kind: "default" });
  }

  for (const re of [EXPORT_FN_RE, EXPORT_CLASS_RE, EXPORT_VAR_RE]) {
    const kind = re === EXPORT_CLASS_RE ? "class" : re === EXPORT_VAR_RE ? "const" : "function";
    re.lastIndex = 0;
    while ((m = re.exec(code)) !== null) {
      if (m[1]) exports.push({ name: m[1], kind });
    }
  }

  return { imports, exports };
}
