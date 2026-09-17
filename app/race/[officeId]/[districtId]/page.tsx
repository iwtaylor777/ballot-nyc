import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Frame } from "@/components/Frame";
import {
  CERTIFICATION,
  candidates as allCandidates,
  certifiedRaceKeys,
  getCandidatesForRace,
  getDistrict,
  getOffice,
  hasCertifiedList,
  isCoveredDistrict,
  offices,
  districts as allDistricts,
  seatsForRace,
} from "@/lib/data";
import { ISSUE_LABELS, type Candidate } from "@/lib/types";
import { ballotpediaUrl } from "@/lib/ballotpedia";

export function generateStaticParams() {
  const seen = new Set<string>();
  const params: Array<{ officeId: string; districtId: string }> = [];
  const add = (officeId: string, districtId: string) => {
    const k = `${officeId}|${districtId}`;
    if (seen.has(k)) return;
    seen.add(k);
    params.push({ officeId, districtId });
  };
  for (const r of certifiedRaceKeys()) add(r.officeId, r.districtId);
  for (const office of offices) {
    for (const d of allDistricts) {
      if (office.scope !== d.type) continue;
      if (allCandidates.some((c) => c.officeId === office.id && c.districtId === d.id)) {
        add(office.id, d.id);
      }
    }
  }
  return params;
}

interface Props {
  // Next 15+ hands route params to pages as a promise.
  params: Promise<{ officeId: string; districtId: string }>;
}

function raceName(officeTitle: string, districtType: string, districtName: string) {
  return districtType === "statewide" ? officeTitle : `${officeTitle} — ${districtName}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { officeId, districtId } = await params;
  const office = getOffice(officeId);
  const district = getDistrict(districtId);
  if (!office || !district || office.scope !== district.type) return {};
  const cands = getCandidatesForRace(office.id, district.id);
  const title = `${raceName(office.title, district.type, district.name)} · Ballot NYC`;
  const description =
    cands.length > 0
      ? `On the Nov 3, 2026 ballot: ${cands.map((c) => c.name).join(", ")}. What the office controls and where candidates stand.`
      : `What this office controls and who's running on Nov 3, 2026.`;
  return {
    title,
    description,
    alternates: { canonical: `/race/${office.id}/${district.id}` },
    openGraph: { title, description, url: `/race/${office.id}/${district.id}` },
    twitter: { title, description },
  };
}

const CERT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(CERTIFICATION.date));

export default async function RacePage({ params }: Props) {
  const { officeId, districtId } = await params;
  const office = getOffice(officeId);
  const district = getDistrict(districtId);
  // An office only exists for districts of its own scope: /race/governor/ush-12
  // is not a race, and must not render as one.
  if (!office || !district || office.scope !== district.type) notFound();
  if (!isCoveredDistrict(district.id)) notFound();
  const candidates = getCandidatesForRace(officeId, districtId);
  const certifiedList = hasCertifiedList(officeId, districtId);
  const seats = seatsForRace(officeId, districtId);
  const bp = ballotpediaUrl(district);
  const anyPositions = candidates.some((c) => c.positions.length > 0);
  const anyFusion = candidates.some((c) => (c.lines?.length ?? 0) > 1);
  const profiled = candidates.filter((c) => !c.certifiedOnly);
  const bareNames = candidates.filter((c) => c.certifiedOnly);

  return (
    <Frame back={{ href: "/ballot", label: "BACK TO BALLOT" }}>
      <section className="pt-2">
        <p className="stamp text-ember">
          {district.type === "statewide"
            ? "STATEWIDE RACE"
            : district.name.toUpperCase()}
        </p>
        <h1 className="poster mt-3 text-5xl">{office.title}</h1>
        {seats > 1 && (
          <p className="stamp mt-3 inline-block bg-ink px-2 py-1 text-paper">
            VOTE FOR UP TO {seats}
          </p>
        )}
      </section>

      <hr className="rule-thick my-8" />

      <section>
        <p className="stamp text-muted">WHY YOU SHOULD CARE</p>
        <ul className="mt-3 space-y-3">
          {office.stakes.map((s, i) => (
            <li key={i} className="flex gap-3 text-base text-ink/90">
              <span className="poster shrink-0 text-3xl leading-none text-ember">
                /
              </span>
              <span className="pt-1">{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <hr className="rule-thin my-8" />

      {candidates.length === 0 ? (
        <section>
          <p className="stamp text-muted">RUNNING</p>
          <div className="mt-3">
            <p className="text-base text-ink/85">
              We haven&apos;t catalogued this race yet — Ballotpedia and your
              official sample ballot list every candidate.
            </p>
            {bp && (
              <a
                href={bp}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center border-[3px] border-ink bg-ember px-6 py-5 text-paper no-underline"
              >
                <span className="poster text-2xl">SEE WHO&apos;S RUNNING →</span>
              </a>
            )}
          </div>
        </section>
      ) : (
        <>
          <section>
            <p className="stamp text-muted">ON THE NOVEMBER 3 BALLOT</p>
            {certifiedList && (
              <p className="mt-1 text-xs text-muted">
                Official list certified by the{" "}
                <a
                  href={CERTIFICATION.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  NYS Board of Elections
                </a>{" "}
                ({CERT_DATE}).
                {candidates.length === 1 && " Only one candidate qualified for this race."}
              </p>
            )}
            {profiled.length > 0 && (
              <div className="mt-4 space-y-8">
                {profiled.map((c) => (
                  <CandidateCard key={c.id} c={c} />
                ))}
              </div>
            )}
            {bareNames.length > 0 && (
              <ul className="mt-4 space-y-3">
                {bareNames.map((c) => (
                  <BareCandidate key={c.id} c={c} />
                ))}
              </ul>
            )}
            {bareNames.length > 0 && (
              <p className="mt-3 text-xs text-muted">
                We haven&apos;t written up these candidates&apos; positions yet.
                We only publish stances we can source.
              </p>
            )}
            {anyFusion && (
              <p className="mt-6 border-l-4 border-ink pl-3 text-sm text-ink/85">
                <span className="font-bold">Same name on two lines?</span> New
                York lets candidates run on more than one party line. It&apos;s
                the same person — your vote counts once, whichever line you
                fill in.
              </p>
            )}
          </section>

          {bp && (
            <a
              href={bp}
              target="_blank"
              rel="noreferrer"
              className="stamp mt-6 inline-block text-muted underline decoration-ember decoration-2 underline-offset-4 hover:text-ember"
            >
              ↗ Full race coverage on Ballotpedia
            </a>
          )}
        </>
      )}

      <hr className="rule-thin my-10" />

      {anyPositions ? (
        <Link
          href="/quiz"
          className="inline-flex w-full items-center justify-center bg-ink px-6 py-5 text-paper no-underline"
        >
          <span className="poster text-2xl">QUIZ ME ON THIS →</span>
        </Link>
      ) : (
        <Link
          href="/ballot"
          className="inline-flex w-full items-center justify-center bg-ink px-6 py-5 text-paper no-underline"
        >
          <span className="poster text-2xl">BACK TO MY BALLOT →</span>
        </Link>
      )}
    </Frame>
  );
}

function Lines({ c }: { c: Candidate }) {
  const lines = c.lines?.length ? c.lines : [c.party];
  return (
    <p className="stamp mt-1 text-muted">
      {lines.map((l) => l.toUpperCase()).join(" · ")}
    </p>
  );
}

function BareCandidate({ c }: { c: Candidate }) {
  const search = `https://ballotpedia.org/wiki/index.php?search=${encodeURIComponent(c.name)}`;
  return (
    <li className="border-[3px] border-ink p-4">
      <h2 className="poster text-2xl">{c.name}</h2>
      <Lines c={c} />
      <a
        href={search}
        target="_blank"
        rel="noreferrer"
        className="stamp mt-3 inline-block underline decoration-ember underline-offset-4"
      >
        Look them up on Ballotpedia →
      </a>
    </li>
  );
}

function CandidateCard({ c }: { c: Candidate }) {
  return (
    <article className="border-[3px] border-ink p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="poster text-3xl">{c.name}</h2>
        {c.incumbent && (
          <span className="stamp shrink-0 bg-ink px-2 py-1 text-paper">INCUMBENT</span>
        )}
      </div>
      {c.runningMate && (
        <p className="mt-1 text-sm font-semibold">
          with {c.runningMate} for Lt. Governor
        </p>
      )}
      <Lines c={c} />
      {c.oneLiner && <p className="mt-3 text-base text-ink/90">{c.oneLiner}</p>}

      <hr className="rule-thin my-5" />

      <p className="stamp text-muted">WHERE THEY STAND</p>
      {c.positions.length === 0 && (
        <p className="mt-2 text-sm text-muted">
          We haven&apos;t catalogued this candidate&apos;s stances on the
          issues yet — the link below has more.
        </p>
      )}
      <ul className="mt-3 space-y-3">
        {c.positions.map((p, i) => (
          <li key={i}>
            <div className="stamp text-ember">{ISSUE_LABELS[p.tag]}</div>
            <p className="mt-1 text-sm text-ink/90">{p.summary}</p>
            <a
              href={p.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-bold text-ink underline"
            >
              Source →
            </a>
          </li>
        ))}
      </ul>

      <a
        href={c.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="stamp mt-5 inline-block underline decoration-ember underline-offset-4"
      >
        More on this candidate →
      </a>

      {c.sampleFlag && (
        <p className="mt-5 border-t border-ink pt-3 text-[10px] uppercase tracking-widest text-muted">
          Sample data — not real candidate
        </p>
      )}
    </article>
  );
}
