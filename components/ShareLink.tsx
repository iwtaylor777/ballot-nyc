"use client";

import { useState } from "react";

/**
 * Sharing the tool itself — no quiz answers, no address, nothing personal.
 */
export function ShareLink({ url = "https://ballotnyc.org" }: { url?: string }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ballot NYC", url });
        return;
      }
    } catch (err) {
      // The user closing the share sheet isn't a failure.
      if ((err as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (common in embedded or private browsing) — show the
      // link so it can be selected by hand.
      setFallback(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={share}
        className="inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-4 text-ink"
      >
        <span className="poster text-xl">
          {copied ? "LINK COPIED ✓" : "SEND THIS TO A FRIEND ↗"}
        </span>
      </button>
      {fallback && (
        <p className="mt-2 break-all text-center text-sm">
          Copy this link:{" "}
          <a href={url} className="font-bold underline">
            {url.replace("https://", "")}
          </a>
        </p>
      )}
    </>
  );
}
