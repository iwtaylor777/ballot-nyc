import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/Frame";
import { CopyBlock } from "@/components/CopyBlock";

const title = "Share Ballot NYC: free voter-guide links, copy and embeds";
const description =
  "Ready-to-share links and copy for NYC community groups, newsletters and newsrooms: judicial candidates, ballot proposals, and an independent ballot lookup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/partners" },
  openGraph: { title, description, url: "/partners" },
};

const EMBED = `<iframe src="https://ballotnyc.org/embed" title="Ballot NYC: What's on your ballot?" width="100%" height="340" style="border:0;max-width:640px" loading="lazy"></iframe>`;

const LINKS: Array<{ label: string; href: string }> = [
  { label: "State Supreme Court candidates in all five boroughs", href: "https://ballotnyc.org/judges" },
  { label: "Brooklyn State Supreme Court candidates", href: "https://ballotnyc.org/race/supreme_court_justice/jd-2" },
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
        <p className="stamp text-ember">FOR NEIGHBORS, NEWSROOMS & COMMUNITY GROUPS</p>
        <h1 className="poster mt-3 text-6xl">
          PUT IT IN
          <br />
          YOUR STORY.
        </h1>
        <p className="mt-4 text-base text-ink/90">
          Ballot NYC is free, nonpartisan, and ad-free. Readers type an
          address and get their Nov 3 ballot — statewide offices, Congress,
          State Senate, Assembly, their borough&apos;s Supreme Court race, and
          the five city proposals — plus a link to their official sample
          ballot for local contests we don&apos;t carry. Coverage is the five
          boroughs. Embed it or link to it; no permission needed.
        </p>
      </section>

      <hr className="rule-thick my-8" />

      <section id="share" className="scroll-mt-4">
        <h2 className="poster text-3xl">Ready to share.</h2>
        <p className="mt-3 text-sm">Use these in a newsletter, group chat, or community resource list. The links contain no personal information. Ballot NYC is independent and does not endorse candidates or ballot positions.</p>
        <h3 className="mt-5 font-semibold">For a group chat</h3>
        <CopyBlock prose label="COPY GROUP CHAT TEXT" text={"Looking up your NYC ballot for November 3, 2026? Ballot NYC is a free, independent, nonpartisan guide to covered races and the five city ballot proposals. No account needed. Check your official sample ballot for the complete list of contests.\nhttps://ballotnyc.org/"} />
        <h3 className="mt-5 font-semibold">For readers researching judges</h3>
        <CopyBlock prose label="COPY JUDGE GUIDE TEXT" text={"Who are the State Supreme Court candidates on your NYC ballot? Choose your borough to see the candidate list, party lines, and number of seats for November 3, 2026. This independent guide covers State Supreme Court races; verify Civil Court and other local contests on your official sample ballot.\nhttps://ballotnyc.org/judges"} />
        <h3 className="mt-5 font-semibold">For a newsletter or resource list</h3>
        <CopyBlock prose label="COPY NEWSLETTER TEXT" text={"Ballot NYC is a free, nonpartisan guide to New York City's November 3, 2026 election. Explore covered races by address, browse State Supreme Court candidates by borough, and read explanations of the five city ballot proposals. The guide links to its sources and to official sample ballots for complete contest verification.\nBallot lookup: https://ballotnyc.org/\nJudge guide: https://ballotnyc.org/judges\nBallot proposals: https://ballotnyc.org/proposals"} />
      </section>

      <hr className="rule-thin my-8" />

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
        <p className="mt-4 text-sm"><Link href="/about#sources" className="underline">Voter-facing sources and methodology</Link> · <Link href="/privacy" className="underline">Privacy and analytics</Link></p>
        <p className="mt-4 text-sm">
          Questions, partnership requests, or a mistake to report? Email{" "}
          <a href="mailto:hello@ballotnyc.org" className="font-bold underline">
            hello@ballotnyc.org
          </a>{" "}
          — include the page and a supporting source if available.
        </p>
      </section>
    </Frame>
  );
}
