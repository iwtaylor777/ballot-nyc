"use client";

import { useState } from "react";

export function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="mt-3 border-[3px] border-ink">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all bg-ink/5 p-3 font-mono text-xs">
        {text}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="w-full border-t-[3px] border-ink bg-ink px-4 py-3 text-paper"
      >
        <span className="stamp">{copied ? "COPIED ✓" : "COPY EMBED CODE"}</span>
      </button>
    </div>
  );
}
