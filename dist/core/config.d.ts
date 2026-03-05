export type ModelProvider = "ollama" | "hf-inference" | "openrouter" | "custom" | "anthropic";
export interface ModelConfig {
    provider: ModelProvider;
    baseUrl?: string;
    apiKey?: string;
    defaultModel: string;
    embeddingModel?: string;
}
export declare function getConfigPath(): string;
export declare function loadConfig(): Promise<ModelConfig | null>;
export declare function saveConfig(config: Partial<ModelConfig>): Promise<void>;
export declare function runConfigWizard(): Promise<void>;
