import { Editor } from "@/components/dynamic-editor";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex flex-1 flex-col min-w-0">
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-2xl font-semibold text-foreground">
              Naffu
            </h1>
            <p className="mb-6 text-muted-foreground">
              Local-first deepwiki. Edit your documentation below.
            </p>
            <Editor />
          </div>
        </div>
        <ChatPanel />
      </main>
    </div>
  );
}
