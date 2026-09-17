"use client";

import { useState } from "react";

/**
 * Compact lookup box for newspapers and partners to iframe into articles.
 * Submitting opens the full site in a new tab. The address travels in the
 * URL fragment (#a=…), which browsers never send to any server.
 */
export default function Embed() {
  const [address, setAddress] = useState("");
  const [fallback, setFallback] = useState<string | null>(null);

  function open(e: React.FormEvent) {
    e.preventDefault();
    const a = address.trim();
    const url = `${window.location.origin}/onboarding${a ? `#a=${encodeURIComponent(a)}` : ""}`;
    // Popup blockers and sandboxed iframes can refuse window.open; show a
    // plain link instead of failing silently.
    const win = window.open(url, "_blank", "noopener");
    if (!win) setFallback(url);
  }

  return (
    <main className="border-[3px] border-ink bg-paper p-4 text-ink">
      <div className="flex items-baseline justify-between gap-3">
        <p className="stamp text-ember">BALLOT · NYC</p>
        <p className="stamp text-muted">NOV 3, 2026</p>
      </div>
      <h1 className="poster mt-2 text-3xl sm:text-4xl">WHAT&apos;S ON YOUR BALLOT?</h1>
      <p className="mt-1 text-sm text-ink/85">
        The races and proposals on your Nov 3 ballot. Free, nonpartisan.
      </p>
      <form onSubmit={open} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="embed-address" className="sr-only">
          Your NYC street address
        </label>
        <input
          id="embed-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="365 Bond St"
          autoComplete="street-address"
          className="min-w-0 flex-1 border-[3px] border-ink bg-paper px-3 py-3 font-display text-xl tracking-tight focus:bg-ember focus:text-paper focus:placeholder-paper/60"
        />
        <button type="submit" className="bg-ink px-4 py-3 text-paper">
          <span className="poster text-xl">SHOW MY BALLOT →</span>
        </button>
      </form>
      {fallback && (
        <p className="mt-2 text-sm font-semibold">
          <a href={fallback} target="_blank" rel="noreferrer" className="underline">
            Open my ballot on ballotnyc.org →
          </a>
        </p>
      )}
      <p className="mt-2 text-[11px] text-muted">
        Opens ballotnyc.org in a new tab. Your address isn&apos;t shared with
        the site you&apos;re reading.
      </p>
    </main>
  );
}
