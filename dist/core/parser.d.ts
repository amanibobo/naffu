/**
 * Lightweight regex-based parser for JS/TS to extract imports and exports.
 */
export interface ParsedFile {
    imports: {
        specifier: string;
        names: string[];
        isDefault?: boolean;
    }[];
    exports: {
        name: string;
        kind: "function" | "class" | "const" | "let" | "var" | "default";
    }[];
}
export declare function parseSource(code: string): ParsedFile;
