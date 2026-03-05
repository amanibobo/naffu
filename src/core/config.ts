import * as p from "@clack/prompts";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

export type ModelProvider =
  | "ollama"
  | "hf-inference"
  | "openrouter"
  | "custom"
  | "anthropic";

export interface ModelConfig {
  provider: ModelProvider;
  baseUrl?: string;
  apiKey?: string;
  defaultModel: string;
  embeddingModel?: string;
}

function getDefaultBaseUrl(provider: string): string {
  switch (provider) {
    case "ollama":
      return "http://localhost:11434";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "custom":
      return "https://generativelanguage.googleapis.com/v1beta/openai/";
    default:
      return "";
  }
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "ollama":
      return "deepseek-coder-v2:lite";
    case "openrouter":
      return "anthropic/claude-3.5-sonnet";
    case "custom":
      return "gemini-1.5-flash-exp";
    case "hf-inference":
      return "microsoft/DialoGPT-medium";
    default:
      return "";
  }
}

export function getConfigPath(): string {
  return path.join(os.homedir(), ".naffurc.json");
}

export async function loadConfig(): Promise<ModelConfig | null> {
  try {
    const configPath = getConfigPath();
    const { readFile } = await import("fs/promises");
    const data = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(data);
    return parsed.model || parsed;
  } catch {
    return null;
  }
}

export async function saveConfig(config: Partial<ModelConfig>): Promise<void> {
  const configPath = getConfigPath();
  const existing = await loadConfig();
  const merged = { ...existing, ...config };
  await writeFile(
    configPath,
    JSON.stringify({ model: merged }, null, 2),
    "utf-8"
  );
}

export async function runConfigWizard(): Promise<void> {
  p.intro("naffu config");

  const provider = await p.select({
    message: "Choose model provider",
    options: [
      { value: "ollama", label: "Ollama (local)", hint: "no API key needed" },
      { value: "hf-inference", label: "Hugging Face Inference" },
      { value: "openrouter", label: "OpenRouter", hint: "100+ models" },
      { value: "custom", label: "Custom", hint: "Gemini, Grok, etc." },
      { value: "skip", label: "Skip", hint: "use defaults" },
    ],
  });

  if (p.isCancel(provider)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  if (provider === "skip") {
    p.outro("Skipped. Run `naffu config` again to set up.");
    return;
  }

  const group = await p.group(
    {
      baseUrl: () =>
        p.text({
          message: "API base URL",
          placeholder: getDefaultBaseUrl(provider),
          initialValue: getDefaultBaseUrl(provider),
        }),
      apiKey: () =>
        p.password({
          message: "API key",
          mask: "*",
        }),
      defaultModel: () =>
        p.text({
          message: "Model ID",
          placeholder: getDefaultModel(provider),
          initialValue: getDefaultModel(provider),
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  await saveConfig({
    provider: provider as ModelProvider,
    ...group,
  });

  p.outro("Config saved to ~/.naffurc.json. Run `naffu index` to test.");
}
