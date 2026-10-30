import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/Frame";
import { certifiedRaceKeys, getDistrict, offices } from "@/lib/data";

export const metadata: Metadata = {
  title: "Browse NYC election races by office and district — 2026 · Ballot NYC",
  description: "Explore the 2026 New York City race guide without entering an address: statewide offices, Congress, State Senate, Assembly, and State Supreme Court.",
  alternates: { canonical: "/races" },
};
export default function RacesPage() {
  const keys = certifiedRaceKeys();
  const covered = offices.filter((o) => keys.some((k) => k.officeId === o.id));
  return <Frame>
    <p className="stamp mt-4 text-ember">2026 · NO ADDRESS NEEDED</p>
    <h1 className="poster mt-3 text-5xl">Browse races by office or district.</h1>
    <p className="mt-4 text-base">Explore the races in our independent NYC guide. District numbers for Congress, State Senate, and Assembly are different systems. <Link href="/onboarding" className="underline">Look up your districts by address</Link> if you are unsure.</p>
    <p className="mt-3 text-sm text-muted">This directory is not an official sample ballot and may omit Civil Court or special local contests. <a href="https://findmypollsite.vote.nyc/" className="underline">Verify your complete official ballot.</a></p>
    <nav aria-label="Jump to an office" className="my-6 flex flex-wrap gap-3 text-sm font-semibold">
      {covered.map((o) => <a key={o.id} href={`#${o.id}`} className="underline">{o.title}</a>)}
    </nav>
    <div className="space-y-8">
      {covered.map((o) => <section key={o.id} id={o.id} className="scroll-mt-4 border-t-[3px] border-ink pt-4">
        <h2 className="poster text-3xl">{o.title}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {keys.filter((k) => k.officeId === o.id).sort((a, b) => a.districtId.localeCompare(b.districtId, "en", { numeric: true })).map((k) => {
            const d = getDistrict(k.districtId)!;
            return <li key={k.districtId}><Link href={`/race/${o.id}/${d.id}`} className="block border-2 border-ink p-3 text-base underline">{d.type === "statewide" ? `New York ${o.title}` : d.name}{d.borough && !d.name.includes(d.borough) ? ` · ${d.borough}` : ""} →</Link></li>;
          })}
        </ul>
      </section>)}
    </div>
  </Frame>;
}
