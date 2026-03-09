"use client";

import dynamic from "next/dynamic";

export const Editor = dynamic(() => import("./editor").then((m) => m.Editor), {
  ssr: false,
});
