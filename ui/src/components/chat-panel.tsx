"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", content: input.trim() }]);
    setInput("");
    // TODO: Call API
  };

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <MessageCircle className="size-4 text-primary" />
        <span className="text-sm font-medium">Ask Naffu</span>
      </div>
      <div className="max-h-48 overflow-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask questions about your codebase. Index a repo first to get
            started.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user"
                    ? "ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm"
                }
              >
                {msg.content}
              </div>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your codebase…"
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
