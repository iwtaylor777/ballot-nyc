import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/Frame";
import { CERTIFICATION } from "@/lib/data";
import { EDITORIAL } from "@/lib/editorial";
import { ELECTION } from "@/lib/election";
export const metadata: Metadata = {
  title: "About, sources, quiz methodology and corrections · Ballot NYC",
  description: "Who makes Ballot NYC, where its election information comes from, how issue comparisons work, what the guide omits, and how to report errors.",
  alternates: { canonical: "/about" },
};
export default function AboutPage() {
  return <Frame>
    <h1 className="poster mt-4 text-5xl">About this guide.</h1>
    <p className="mt-4">Ballot NYC is an independent project by Ian Taylor. It is free, nonpartisan, and ad-free. It does not endorse candidates or ballot-question positions and is not operated by the Board of Elections.</p>
    <nav aria-label="About sections" className="my-5 flex flex-wrap gap-4 text-sm underline"><a href="#sources">Sources</a><a href="#quiz">Quiz methodology</a><a href="#reviews">Review dates</a><Link href="/privacy">Privacy</Link><a href="#corrections">Corrections</a></nav>
    <section id="sources" className="mt-8 space-y-4 border-t-[3px] border-ink pt-5">
      <h2 className="poster text-3xl">Sources and methodology</h2>
      <p>Our guide covers statewide offices, Congress, State Senate, Assembly, borough State Supreme Court races, and city proposals. Civil Court and special local contests may be missing. An address match does not establish registration, eligibility, or every contest. <a href={ELECTION.pollSite} className="underline">Check your official sample ballot and assigned poll sites.</a></p>
      <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed">
        <li><strong>Who appears on the ballot:</strong> <a href={CERTIFICATION.url} className="underline">NYS Board of Elections certification</a>, dated {CERTIFICATION.date}. Party lines and multi-seat voting limits come from that list. A certification date is a source date, not our editorial review date.</li>
        <li><strong>Candidate statements:</strong> linked campaign materials, public records, and reporting support individual position summaries. A campaign statement describes what a candidate says; it is not independent verification that a policy will work. Ballotpedia provides additional background.</li>
        <li><strong>Our summaries:</strong> office explanations, candidate summaries, and issue-scale assignments are editorial interpretations. They are distinct from official ballot wording and from direct quotations. Each researched position retains its source link; missing research is labeled.</li>
        <li><strong>Ballot proposals:</strong> official titles and linked abstracts come from the <a href="https://www.nyc.gov/site/charter/index.page" className="underline">NYC Charter Revision Commission</a>. The “what changes,” “yes,” and “no” explanations are our plain-language summaries, not substitutes for the official text.</li>
        <li><strong>Addresses and districts:</strong> NYC Planning GeoSearch supplies address candidates; the U.S. Census geocoder resolves districts. Ambiguous addresses require your choice. Verify the final guide against the official sample ballot.</li>
        <li><strong>Voting guidance:</strong> <a href={ELECTION.source} className="underline">NYS BOE registration/deadline rules</a> and <a href={ELECTION.hoursSource} className="underline">NYC BOE dates and hours</a>. Official guidance takes precedence if information differs.</li>
      </ul>
    </section>
    <section id="quiz" className="mt-8 space-y-4 border-t border-ink pt-5">
      <h2 className="poster text-3xl">How the issue quiz works</h2>
      <p>Answers and researched candidate positions are assigned values on an editorial 0–100 scale for each issue. The score is 100 minus the weighted average absolute distance between your answer and the candidate’s value, rounded to a whole number. Selected priorities count twice; their order does not change the score.</p>
      <p>Only issues you answered and the candidate has a sourced position on are compared. Skipping a question removes it from the comparison, including a previously saved answer. Missing research is not disagreement. Judicial candidates are not scored. Results distinguish no research from no overlap with your answers.</p>
      <p>A score is a limited issue comparison, not a recommendation, endorsement, probability, or measure of overall suitability. Candidates may have different evidence coverage, and a one-issue score is especially limited. Some policies can coexist: choose the closest emphasis, or skip if the choices do not represent you. The quiz cannot capture every combination of views.</p>
      <Link href="/quiz" className="inline-block font-semibold underline">Try the issue comparison quiz →</Link>
    </section>
    <section id="reviews" className="mt-8 space-y-3 border-t border-ink pt-5 text-sm">
      <h2 className="poster text-3xl">Review dates</h2>
      <p>Deadline guidance reviewed against the official sources above: <time dateTime={EDITORIAL.guidanceReviewed}>{EDITORIAL.guidanceReviewed}</time>. Methodology and privacy implementation reviewed: {EDITORIAL.methodologyReviewed}.</p>
      <p>The dataset does not yet record a separate editorial review date for every candidate claim or proposal summary. We do not label those as newly fact-checked when interface text changes. Source-publication dates, where available, are on the linked source pages. Candidate certification is dated {CERTIFICATION.date}.</p>
    </section>
    <section id="corrections" className="mt-8 space-y-3 border-t border-ink pt-5">
      <h2 className="poster text-3xl">Corrections</h2>
      <p>Found a mistake or an address lookup problem? <a href="mailto:hello@ballotnyc.org" className="font-semibold underline">Email hello@ballotnyc.org</a> with the page, the issue, and a supporting source if you have one. You do not need to send quiz answers or a full home address; start with the street or district and what failed.</p>
      <p className="text-sm">Messages are forwarded through ImprovMX to the maintainer’s Gmail inbox. Corrections are reviewed against the cited sources; we cannot promise an immediate response. For urgent registration, eligibility, or voting questions, <a href={ELECTION.board} className="underline">contact your Board of Elections</a>.</p>
    </section>
  </Frame>;
}
