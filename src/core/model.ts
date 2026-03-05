import OpenAI from "openai";
import type { ModelConfig } from "./config";

export class ModelClient {
  private openai?: OpenAI;

  constructor(private config: ModelConfig) {
    if (
      config.provider === "custom" ||
      config.provider === "openrouter"
    ) {
      this.openai = new OpenAI({
        apiKey: config.apiKey!,
        baseURL: config.baseUrl || undefined,
      });
    }
  }

  async chat(prompt: string): Promise<string> {
    if (this.openai) {
      const res = await this.openai.chat.completions.create({
        model: this.config.defaultModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });
      return res.choices[0]?.message?.content || "";
    }
    // ollama / hf handlers go here
    throw new Error("Provider not implemented");
  }
}
