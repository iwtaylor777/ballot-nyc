"use client";

import { useState } from "react";

export function CopyBlock({ text, label = "COPY EMBED CODE", prose = false }: { text: string; label?: string; prose?: boolean }) {
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
      <pre className={`overflow-x-auto whitespace-pre-wrap bg-ink/5 p-3 ${prose ? "break-words font-sans text-sm" : "break-all font-mono text-xs"}`}>
        {text}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="w-full border-t-[3px] border-ink bg-ink px-4 py-3 text-paper"
      >
        <span className="stamp" aria-live="polite">{copied ? "COPIED ✓" : label}</span>
      </button>
    </div>
  );
}
