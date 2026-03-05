export type AgentType = "cursor" | "claude-code" | "github-copilot" | "windsurf" | "open-code";
export declare function initWorkspace(cwd: string, agent?: AgentType): Promise<{
    agentRule?: string;
}>;
