import type { Metadata } from "next";
import { Frame } from "@/components/Frame";
import { CopyBlock } from "@/components/CopyBlock";

const title = "For newsrooms & partners · Ballot NYC";
const description =
  "Embed a free, nonpartisan 'What's on your ballot?' lookup in your NYC election coverage.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/partners" },
  openGraph: { title, description, url: "/partners" },
};

const EMBED = `<iframe src="https://ballotnyc.org/embed" title="Ballot NYC: What's on your ballot?" width="100%" height="340" style="border:0;max-width:640px" loading="lazy"></iframe>`;

const LINKS: Array<{ label: string; href: string }> = [
  { label: "Build-your-ballot lookup", href: "https://ballotnyc.org/onboarding" },
  { label: "All five NYC ballot proposals", href: "https://ballotnyc.org/proposals" },
  { label: "Registration & early-voting dates", href: "https://ballotnyc.org/dates" },
  { label: "A single race, e.g. NY-10", href: "https://ballotnyc.org/race/us_representative/ush-10" },
  { label: "A State Senate race, e.g. SD 26", href: "https://ballotnyc.org/race/state_senator/ss-26" },
];

export default function PartnersPage() {
  return (
    <Frame back={{ href: "/", label: "HOME" }}>
      <section className="pt-2">
        <p className="stamp text-ember">FOR NEWSROOMS</p>
        <h1 className="poster mt-3 text-6xl">
          PUT IT IN
          <br />
          YOUR STORY.
        </h1>
        <p className="mt-4 text-base text-ink/90">
          Ballot NYC is free, nonpartisan, and ad-free. Readers type an
          address and get every race on their Nov 3 ballot — Congress, State
          Senate, Assembly, judges, and the five city proposals. Embed it or
          link to it; no permission needed.
        </p>
      </section>

      <hr className="rule-thick my-8" />

      <section>
        <p className="stamp text-muted">EMBED THE LOOKUP BOX</p>
        <p className="mt-2 text-sm text-ink/85">
          Paste this into an HTML block. It opens results on ballotnyc.org in
          a new tab, and the reader&apos;s address is never sent to your site.
        </p>
        <CopyBlock text={EMBED} />
        <p className="stamp mt-4 text-muted">PREVIEW</p>
        <iframe
          src="/embed"
          title="Ballot NYC embed preview"
          className="mt-2 w-full border-0"
          style={{ height: 340 }}
          loading="lazy"
        />
      </section>

      <hr className="rule-thin my-8" />

      <section>
        <p className="stamp text-muted">DEEP LINKS</p>
        <ul className="mt-3 space-y-2 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <span className="font-semibold">{l.label}:</span>{" "}
              <a href={l.href} className="break-all underline">
                {l.href.replace("https://", "")}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <hr className="rule-thin my-8" />

      <section>
        <p className="stamp text-muted">WHERE THE DATA COMES FROM</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/85">
          <li>
            Candidates and party lines: NYS Board of Elections certified
            candidate list for the Nov 3, 2026 general election.
          </li>
          <li>
            Districts: U.S. Census Bureau geocoder (current congressional and
            state legislative lines).
          </li>
          <li>Addresses: NYC Planning GeoSearch (the city&apos;s official address directory).</li>
          <li>Proposals: official abstracts from the 2026 NYC Charter Revision Commission.</li>
          <li>Candidate positions: only where we can link a public source.</li>
        </ul>
        <p className="mt-4 text-sm">
          Found a mistake?{" "}
          <a
            href="https://github.com/iwtaylor777/ballot-nyc/issues"
            target="_blank"
            rel="noreferrer"
            className="font-bold underline"
          >
            Tell us
          </a>{" "}
          — we fix errors fast.
        </p>
      </section>
    </Frame>
  );
}
