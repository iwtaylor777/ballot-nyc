"use client";

import { useState } from "react";

/** Copy an explicit public URL, never the visitor's current URL or saved state. */
export function CopyGuideLink({ path, label = "COPY GUIDE LINK" }: { path: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const url = `https://ballotnyc.org${path}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus("copied"); }
    catch { setStatus("manual"); }
  }
  return <div>
    <button type="button" onClick={copy} className="border-2 border-ink px-4 py-3 text-sm font-semibold">{label}</button>
    <p role="status" className="mt-2 text-sm text-muted">{status === "copied" ? "Link copied. Ready to paste into a message." : status === "manual" ? "Copy this public link to share the guide:" : "Share this public page without sharing your address or quiz answers."}</p>
    {status === "manual" && <input aria-label="Public guide link" value={url} readOnly onFocus={(e) => e.currentTarget.select()} className="mt-2 w-full border-2 border-ink bg-paper p-2 text-sm" />}
  </div>;
}
