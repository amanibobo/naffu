#!/usr/bin/env node

import * as p from "@clack/prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initWorkspace } from "./commands/init";
import { openDocs } from "./commands/open";
import { indexRepo } from "./commands/index";
import { runConfigWizard } from "./core/config";

yargs(hideBin(process.argv))
  .scriptName("naffu")
  .command(
    "init",
    "Initialize Naffu workspace",
    (yargs) =>
      yargs.option("agent", {
        type: "string",
        choices: ["cursor", "claude-code", "github-copilot", "windsurf", "open-code"],
        describe: "Link to your coding agent (adds agent rules)",
      }),
    async (argv) => {
      p.intro("naffu init");
      const agent = argv.agent as "cursor" | "claude-code" | "github-copilot" | "windsurf" | "open-code" | undefined;
      const s = p.spinner();
      s.start("Initializing workspace");
      const { agentRule } = await initWorkspace(process.cwd(), agent);
      s.stop("Workspace initialized");
      if (agentRule) p.log.step(`Agent rule added: ${agentRule}`);
      p.outro("Your agent can now use Naffu tools. Run `naffu index .` to analyze the codebase.");
    }
  )
  .command(
    "open",
    "Open the interactive docs UI",
    () => {},
    async () => {
      p.intro("naffu open");
      const s = p.spinner();
      s.start("Starting docs server");
      await openDocs(process.cwd());
      s.stop("Docs at http://localhost:4242");
      p.note("Press Ctrl+C to stop the server", "Running");
    }
  )
  .command(
    "index",
    "Manually index the repo",
    (yargs) =>
      yargs.positional("path", {
        default: ".",
        describe: "Repo path",
      }),
    async (argv) => {
      const pathArg = (argv as { path?: string }).path || ".";
      p.intro("naffu index");
      const s = p.spinner();
      s.start("Indexing codebase");
      await indexRepo(pathArg);
      s.stop("Index complete");
      p.outro("Run `naffu open` to view the docs.");
    }
  )
  .command(
    "config",
    "Interactive model/API key wizard",
    () => {},
    async () => {
      await runConfigWizard();
    }
  )
  .help()
  .parse();
