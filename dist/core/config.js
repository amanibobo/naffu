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
exports.getConfigPath = getConfigPath;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.runConfigWizard = runConfigWizard;
const p = __importStar(require("@clack/prompts"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
function getDefaultBaseUrl(provider) {
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
function getDefaultModel(provider) {
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
function getConfigPath() {
    return path_1.default.join(os_1.default.homedir(), ".naffurc.json");
}
async function loadConfig() {
    try {
        const configPath = getConfigPath();
        const { readFile } = await Promise.resolve().then(() => __importStar(require("fs/promises")));
        const data = await readFile(configPath, "utf-8");
        const parsed = JSON.parse(data);
        return parsed.model || parsed;
    }
    catch {
        return null;
    }
}
async function saveConfig(config) {
    const configPath = getConfigPath();
    const existing = await loadConfig();
    const merged = { ...existing, ...config };
    await (0, promises_1.writeFile)(configPath, JSON.stringify({ model: merged }, null, 2), "utf-8");
}
async function runConfigWizard() {
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
    const group = await p.group({
        baseUrl: () => p.text({
            message: "API base URL",
            placeholder: getDefaultBaseUrl(provider),
            initialValue: getDefaultBaseUrl(provider),
        }),
        apiKey: () => p.password({
            message: "API key",
            mask: "*",
        }),
        defaultModel: () => p.text({
            message: "Model ID",
            placeholder: getDefaultModel(provider),
            initialValue: getDefaultModel(provider),
        }),
    }, {
        onCancel: () => {
            p.cancel("Operation cancelled.");
            process.exit(0);
        },
    });
    await saveConfig({
        provider: provider,
        ...group,
    });
    p.outro("Config saved to ~/.naffurc.json. Run `naffu index` to test.");
}
