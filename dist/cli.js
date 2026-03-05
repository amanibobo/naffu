#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const p = __importStar(require("@clack/prompts"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const init_1 = require("./commands/init");
const open_1 = require("./commands/open");
const index_1 = require("./commands/index");
const config_1 = require("./core/config");
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .scriptName("naffu")
    .command("init", "Initialize Naffu workspace", (yargs) => yargs.option("agent", {
    type: "string",
    choices: ["cursor", "claude-code", "github-copilot", "windsurf", "open-code"],
    describe: "Link to your coding agent (adds agent rules)",
}), async (argv) => {
    p.intro("naffu init");
    const agent = argv.agent;
    const s = p.spinner();
    s.start("Initializing workspace");
    const { agentRule } = await (0, init_1.initWorkspace)(process.cwd(), agent);
    s.stop("Workspace initialized");
    if (agentRule)
        p.log.step(`Agent rule added: ${agentRule}`);
    p.outro("Your agent can now use Naffu tools. Run `naffu index .` to analyze the codebase.");
})
    .command("open", "Open the interactive docs UI", () => { }, async () => {
    p.intro("naffu open");
    const s = p.spinner();
    s.start("Starting docs server");
    await (0, open_1.openDocs)(process.cwd());
    s.stop("Docs at http://localhost:4242");
    p.note("Press Ctrl+C to stop the server", "Running");
})
    .command("index", "Manually index the repo", (yargs) => yargs.positional("path", {
    default: ".",
    describe: "Repo path",
}), async (argv) => {
    const pathArg = argv.path || ".";
    p.intro("naffu index");
    const s = p.spinner();
    s.start("Indexing codebase");
    await (0, index_1.indexRepo)(pathArg);
    s.stop("Index complete");
    p.outro("Run `naffu open` to view the docs.");
})
    .command("config", "Interactive model/API key wizard", () => { }, async () => {
    await (0, config_1.runConfigWizard)();
})
    .help()
    .parse();
