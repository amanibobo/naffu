"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode, FolderOpen } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <FolderOpen className="size-5 text-primary" />
        <span className="font-semibold text-sidebar-foreground">Naffu</span>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <Button className="w-full" size="sm">
          Index repo
        </Button>
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Indexed files
          </h3>
          <ScrollArea className="h-[200px]">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 truncate">
                <FileCode className="size-3.5 shrink-0" />
                <span>No files indexed yet</span>
              </li>
            </ul>
          </ScrollArea>
        </div>
      </div>
    </aside>
  );
}
