"use client";

import { useState } from "react";

/**
 * Sharing the tool itself — no quiz answers, no address, nothing personal.
 */
export function ShareLink({ url = "https://ballotnyc.org" }: { url?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ballot NYC", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Cancelled share sheet or blocked clipboard — nothing to report.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-4 text-ink"
    >
      <span className="poster text-xl">
        {copied ? "LINK COPIED ✓" : "SEND THIS TO A FRIEND ↗"}
      </span>
    </button>
  );
}
