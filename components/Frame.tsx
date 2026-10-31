"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useElectionNow } from "./ElectionClock";
import { ELECTION, electionState } from "@/lib/election";
import { GA_ID } from "@/lib/analytics";

const HEADER_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function Frame({
  children,
  back,
}: {
  children: React.ReactNode;
  back?: { href: string; label: string };
}) {
  const { archived } = electionState(useElectionNow());
  const pathname = usePathname();
  const headerLabel = archived ? "ARCHIVE" : "ELECTION";
  const headerDate = HEADER_FORMAT.format(new Date(ELECTION.day))
    .toUpperCase()
    .replace(" ", " ");
  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col">
      <header className="flex items-center justify-between px-5 pt-5">
        <Link href="/" className="stamp text-ink no-underline">
          BALLOT · NYC
        </Link>
        <span className="stamp text-muted">
          {headerLabel} · {headerDate} · 2026
        </span>
      </header>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:px-5 focus:py-3">Skip to content</a>
      <nav aria-label="Main navigation" className="flex flex-wrap gap-x-4 gap-y-2 border-b border-ink/20 px-5 py-4 text-sm font-semibold">
        {[["/ballot", archived ? "2026 ballot" : "My ballot"], ["/races", "Browse races"], ["/proposals", "Proposals"], ["/dates", "Dates"], ["/plan", archived ? "2026 plan" : "Plan"]].map(([href, label]) => (
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={pathname === href ? "underline decoration-ember decoration-2 underline-offset-4" : "hover:underline"}>{label}</Link>
        ))}
      </nav>
      {archived && <aside className="mx-5 mt-4 border-l-4 border-ember pl-3 text-sm"><strong>Archived 2026 guide.</strong> In-person voting ended Nov 3 at 9 PM. These are historical races and proposals. <a href={ELECTION.hoursSource} className="underline">Current official election information →</a></aside>}
      {back && (
        <div className="px-5 pt-4">
          <Link
            href={back.href}
            className="stamp inline-flex items-center gap-2 text-ink no-underline hover:text-ember"
          >
            ← {back.label}
          </Link>
        </div>
      )}
      <main id="main-content" className="flex-1 px-5 pb-24 pt-2">{children}</main>
      <footer className="space-y-2 border-t border-ink px-5 py-5">
        <p className="stamp text-muted">
          NONPARTISAN · NO ACCOUNTS · NO ADS
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Sources: NYS Board of Elections certified candidate list, NYC Board
          of Elections, NYC Charter Revision Commission, Ballotpedia, U.S.
          Census Bureau, NYC Planning GeoSearch.{" "}
          {GA_ID && "We count visits with Google Analytics, with Google's ad features off. "}
          Spot an error?{" "}
          <a href="mailto:hello@ballotnyc.org" className="underline">
            hello@ballotnyc.org
          </a>
        </p>
        <nav aria-label="About this guide" className="flex flex-wrap gap-x-4 gap-y-2 py-2 text-sm">
          <Link href="/about" className="underline">About</Link>
          <Link href="/about#sources" className="underline">Sources and methodology</Link>
          <Link href="/privacy" className="underline">Privacy</Link>
          <Link href="/about#corrections" className="underline">Corrections</Link>
        </nav>
        <p className="flex justify-between gap-3 stamp text-[10px] text-muted">
          <span>AN IAN TAYLOR JOINT</span>
          <Link href="/partners#share" className="text-muted underline">
            SHARE THE GUIDE
          </Link>
        </p>
      </footer>
    </div>
  );
}
