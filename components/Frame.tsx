import Link from "next/link";
import { nextElection } from "@/lib/data";

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
  const next = nextElection();
  const headerLabel = next.id === "primary-day" ? "PRIMARY" : "ELECTION";
  const headerDate = HEADER_FORMAT.format(new Date(next.date))
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
      <main className="flex-1 px-5 pb-24 pt-2">{children}</main>
      <footer className="space-y-2 border-t border-ink px-5 py-5">
        <p className="stamp text-muted">
          NONPARTISAN · NO ACCOUNTS · NO TRACKING
        </p>
        <p className="text-[11px] leading-relaxed text-muted">
          Sources: NYS Board of Elections certified candidate list, NYC Board
          of Elections, NYC Charter Revision Commission, Ballotpedia, U.S.
          Census Bureau, NYC Planning GeoSearch.{" "}
          <a
            href="https://github.com/iwtaylor777/ballot-nyc/issues"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Spot an error? Tell us.
          </a>
        </p>
        <p className="flex justify-between gap-3 stamp text-[10px] text-muted">
          <span>AN IAN TAYLOR JOINT</span>
          <Link href="/partners" className="text-muted underline">
            FOR NEWSROOMS
          </Link>
        </p>
      </footer>
    </div>
  );
}
