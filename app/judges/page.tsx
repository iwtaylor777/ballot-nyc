import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/Frame";
import { CopyGuideLink } from "@/components/CopyGuideLink";
import { CERTIFICATION, coveredDistricts, getCandidatesForRace, seatsForRace } from "@/lib/data";

const title = "NYC judge candidates 2026: State Supreme Court by borough · Ballot NYC";
const description = "Find your 2026 NYC State Supreme Court candidates by borough, see how many candidates you may choose, and verify your official sample ballot. Free, independent, nonpartisan guide.";
export const metadata: Metadata = { title, description, alternates: { canonical: "/judges" }, openGraph: { title, description, url: "/judges" }, twitter: { title, description } };

export default function JudgesPage() {
  const districts = coveredDistricts("judicial").sort((a, b) => (a.borough || "").localeCompare(b.borough || ""));
  return <Frame>
    <p className="stamp mt-4 text-ember">NOVEMBER 3, 2026 · ALL FIVE BOROUGHS</p>
    <h1 className="poster mt-3 text-5xl">NYC judge candidates.<br /><span className="text-ember">Start with your borough.</span></h1>
    <p className="mt-4 text-base">Looking at “Justice of the Supreme Court” on your ballot? Choose your borough to see the candidates, party lines, and number of seats in that race. No address or account needed.</p>
    <aside className="mt-4 border-l-4 border-ember pl-3 text-sm text-muted"><strong>State Supreme Court races only.</strong> This independent guide may omit Civil Court and other local judicial contests. <a href="https://findmypollsite.vote.nyc/" className="underline">Check your complete official sample ballot</a> before voting.</aside>
    <nav aria-label="State Supreme Court candidates by borough" className="mt-6">
      <ul className="space-y-3">{districts.map((d) => {
        const count = getCandidatesForRace("supreme_court_justice", d.id).length;
        const seats = seatsForRace("supreme_court_justice", d.id);
        return <li key={d.id}><Link href={`/race/supreme_court_justice/${d.id}`} className="block border-[3px] border-ink p-4 hover:bg-ink/5">
          <span className="poster block text-3xl">{d.borough} candidates →</span>
          <span className="mt-1 block text-sm">{d.name} · {count} {count === 1 ? "candidate" : "candidates"} · Vote for up to {seats}</span>
        </Link></li>;
      })}</ul>
    </nav>
    <p className="mt-3 text-sm text-muted">Candidate lists and seat counts use the <a href={CERTIFICATION.url} className="underline">NYS Board of Elections certification dated {CERTIFICATION.date}</a>. Follow the instructions on your official ballot.</p>
    <div className="mt-5"><CopyGuideLink path="/judges" label="COPY JUDGE GUIDE LINK" /></div>
    <hr className="rule-thick my-8" />
    <section className="space-y-6">
      <div><h2 className="poster text-3xl">What is this court?</h2><p className="mt-2">New York State Supreme Court is a trial court with broad civil and criminal jurisdiction. New York’s highest court is the Court of Appeals. These are state judicial races, separate from the U.S. Supreme Court.</p><p className="mt-2 text-sm"><a href="https://www.nycourts.gov/courts/8th-judicial-district/court-structure" className="underline">NY Courts: court structure</a> · <a href="https://www.nycourts.gov/appellate-courts" className="underline">NY Courts: appellate courts</a></p></div>
      <div><h2 className="poster text-3xl">Which judicial district is mine?</h2><p className="mt-2">Each NYC borough is in a different judicial district: Manhattan is 1, Brooklyn is 2, Queens is 11, the Bronx is 12, and Staten Island is 13. These numbers are different from congressional or state legislative districts.</p><p className="mt-2 text-sm"><a href="https://www.nycourts.gov/about-us/administration" className="underline">Official judicial district and county list</a></p></div>
      <div><h2 className="poster text-3xl">How can I research the candidates?</h2><p className="mt-2">Start with the names and party lines on your borough’s race page, then follow the linked candidate research and official sources. A name appearing in this guide is not an endorsement. Missing profiles mean we have not published sourced research for that candidate.</p><p className="mt-2 text-sm"><Link href="/about#sources" className="underline">Our sources and methodology</Link> · Court explainer reviewed October 31, 2026; candidate certification date is shown separately above.</p></div>
    </section>
    <section className="mt-8 border-t-[3px] border-ink pt-5">
      <h2 className="poster text-3xl">See the rest of your ballot.</h2>
      <p className="mt-2">Explore covered races for your address and the five city ballot proposals.</p>
      <Link href="/onboarding" className="mt-4 block bg-ink px-4 py-4 text-center text-paper"><span className="poster text-2xl">BUILD MY BALLOT →</span></Link>
      <Link href="/proposals" className="mt-4 block underline">Read the five NYC ballot proposals →</Link>
    </section>
  </Frame>;
}
