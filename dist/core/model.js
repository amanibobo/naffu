"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelClient = void 0;
const openai_1 = __importDefault(require("openai"));
class ModelClient {
    config;
    openai;
    constructor(config) {
        this.config = config;
        if (config.provider === "custom" ||
            config.provider === "openrouter") {
            this.openai = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: config.baseUrl || undefined,
            });
        }
    }
    async chat(prompt) {
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
exports.ModelClient = ModelClient;
