"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

export function Editor() {
  const editor = useCreateBlockNote();

  return (
    <div className="bn-editor-wrapper min-h-[400px] w-full rounded-lg border border-border bg-background p-4 [&_.bn-editor]:min-h-[350px]">
      <BlockNoteView editor={editor} theme="light" />
    </div>
  );
}
