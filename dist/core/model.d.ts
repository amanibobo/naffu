import type { ModelConfig } from "./config";
export declare class ModelClient {
    private config;
    private openai?;
    constructor(config: ModelConfig);
    chat(prompt: string): Promise<string>;
}
