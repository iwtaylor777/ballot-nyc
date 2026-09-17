import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/Frame";
import { proposals } from "@/lib/data";

const title = "NYC Ballot Proposals 1–5 · Ballot NYC";
const description =
  "Every NYC voter will see five City Charter proposals on the Nov 3, 2026 ballot. What each one changes, and what a Yes or No vote means.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/proposals" },
  openGraph: { title, description, url: "/proposals" },
  twitter: { title, description },
};

export default function ProposalsPage() {
  return (
    <Frame back={{ href: "/ballot", label: "BACK TO BALLOT" }}>
      <section className="pt-2">
        <p className="stamp text-ember">CITYWIDE · EVERY NYC BALLOT</p>
        <h1 className="poster mt-3 text-6xl">
          FLIP YOUR
          <br />
          BALLOT.
        </h1>
        <p className="mt-4 text-base text-ink/90">
          Five yes-or-no questions would change the NYC City Charter. Ballot
          proposals are usually printed on the back of the ballot, so turn it
          over before you scan it.
        </p>
        <p className="mt-3 text-sm text-muted">
          Proposed by the 2026 Charter Revision Commission (the Commission on
          Government Efficiency, appointed by the Mayor). Summaries below are
          drawn from the Commission&apos;s official ballot abstracts.
        </p>
      </section>

      <hr className="rule-thick my-8" />

      <ol className="space-y-8">
        {proposals.map((p) => (
          <li key={p.id} id={`q${p.number}`} className="border-[3px] border-ink p-5">
            <p className="stamp text-ember">QUESTION {p.number}</p>
            <h2 className="poster mt-2 text-2xl sm:text-3xl">{p.headline}</h2>
            <p className="mt-2 text-xs text-muted">Official title: {p.title}</p>

            <p className="stamp mt-5 text-muted">WHAT IT CHANGES</p>
            <ul className="mt-2 space-y-2">
              {p.changes.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink/90">
                  <span className="poster shrink-0 text-2xl leading-none text-ember">/</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="border-2 border-ink p-3">
                <dt className="stamp">A YES VOTE</dt>
                <dd className="mt-1 text-sm text-ink/90">{p.yesMeans}</dd>
              </div>
              <div className="border-2 border-ink p-3">
                <dt className="stamp">A NO VOTE</dt>
                <dd className="mt-1 text-sm text-ink/90">{p.noMeans}</dd>
              </div>
            </dl>

            <a
              href={p.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="stamp mt-4 inline-block underline decoration-ember underline-offset-4"
            >
              Official abstract →
            </a>
          </li>
        ))}
      </ol>

      <hr className="rule-thin my-10" />

      <p className="text-sm text-ink/85">
        Read the full text:{" "}
        <a
          href="https://www.nyc.gov/assets/charter/downloads/pdf/2026/appendix_c_proposed_charter_amendments_20260723.pdf"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline"
        >
          proposed Charter amendments (PDF)
        </a>{" "}
        ·{" "}
        <a
          href="https://www.nyc.gov/site/charter/index.page"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline"
        >
          Charter Revision Commission
        </a>
      </p>

      <Link
        href="/ballot"
        className="mt-8 inline-flex w-full items-center justify-center bg-ink px-6 py-5 text-paper no-underline"
      >
        <span className="poster text-2xl">BACK TO MY BALLOT →</span>
      </Link>
    </Frame>
  );
}
