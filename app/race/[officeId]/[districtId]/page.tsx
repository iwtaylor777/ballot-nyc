import Link from "next/link";
import { notFound } from "next/navigation";
import { Frame } from "@/components/Frame";
import {
  candidates as allCandidates,
  getCandidatesForRace,
  getDistrict,
  getOffice,
  offices,
  districts as allDistricts,
} from "@/lib/data";
import { ISSUE_LABELS, type Candidate } from "@/lib/types";
import { ballotpediaUrl } from "@/lib/ballotpedia";

export function generateStaticParams() {
  const params: Array<{ officeId: string; districtId: string }> = [];
  for (const office of offices) {
    for (const d of allDistricts) {
      if (office.scope === d.type) {
        const hasCandidates = allCandidates.some(
          (c) => c.officeId === office.id && c.districtId === d.id,
        );
        if (hasCandidates) {
          params.push({ officeId: office.id, districtId: d.id });
        }
      }
    }
  }
  return params;
}

interface Props {
  params: { officeId: string; districtId: string };
}

export default function RacePage({ params }: Props) {
  const office = getOffice(params.officeId);
  const district = getDistrict(params.districtId);
  if (!office || !district) notFound();
  const candidates = getCandidatesForRace(params.officeId, params.districtId);
  const general = candidates.filter((c) => c.contest !== "primary");
  const primary = candidates.filter((c) => c.contest === "primary");
  const bp = ballotpediaUrl(district);

  return (
    <Frame back={{ href: "/ballot", label: "BACK TO BALLOT" }}>
      <section className="pt-2">
        <p className="stamp text-ember">
          {district.type === "statewide"
            ? "STATEWIDE RACE"
            : district.name.toUpperCase()}
        </p>
        <h1 className="poster mt-3 text-5xl">{office.title}</h1>
      </section>

      <hr className="rule-thick my-8" />

      <section>
        <p className="stamp text-muted">WHY YOU SHOULD CARE</p>
        <ul className="mt-3 space-y-3">
          {office.stakes.map((s, i) => (
            <li key={i} className="flex gap-3 text-base text-ink/90">
              <span className="poster shrink-0 text-3xl text-ember leading-none">
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
              We haven&apos;t catalogued this race yet — but Ballotpedia
              tracks every candidate in your district.
            </p>
            {bp && (
              <a
                href={bp}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center border-[3px] border-ink bg-ember px-6 py-5 text-paper no-underline"
              >
                <span className="poster text-2xl">
                  SEE WHO&apos;S RUNNING →
                </span>
              </a>
            )}
          </div>
        </section>
      ) : (
        <>
          {general.length > 0 && (
            <section>
              <p className="stamp text-muted">ON THE NOVEMBER 3 BALLOT</p>
              <div className="mt-3 space-y-8">
                {general.map((c) => (
                  <CandidateCard key={c.id} c={c} />
                ))}
              </div>
            </section>
          )}

          {general.length > 0 && primary.length > 0 && (
            <hr className="rule-thin my-8" />
          )}

          {primary.length > 0 && (
            <section>
              <p className="stamp text-muted">
                STILL IN THE PRIMARY · JUNE 23
              </p>
              <p className="mt-2 text-xs text-muted">
                These candidates are competing for their party&apos;s
                nomination. Whoever wins joins the November ballot.
              </p>
              <div className="mt-3 space-y-8">
                {primary.map((c) => (
                  <CandidateCard key={c.id} c={c} />
                ))}
              </div>
            </section>
          )}

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

      <Link
        href="/quiz"
        className="inline-flex w-full items-center justify-center bg-ink px-6 py-5 text-paper no-underline"
      >
        <span className="poster text-2xl">QUIZ ME ON THIS →</span>
      </Link>
    </Frame>
  );
}

function CandidateCard({ c }: { c: Candidate }) {
  return (
    <article className="border-[3px] border-ink p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="poster text-3xl">{c.name}</h2>
        {c.incumbent && (
          <span className="stamp bg-ink px-2 py-1 text-paper">INCUMBENT</span>
        )}
      </div>
      <p className="stamp mt-1 text-muted">{c.party.toUpperCase()}</p>
      <p className="mt-3 text-base text-ink/90">{c.oneLiner}</p>

      <hr className="rule-thin my-5" />

      <p className="stamp text-muted">WHERE THEY STAND</p>
      {c.positions.length === 0 && (
        <p className="mt-2 text-sm text-muted">
          We haven&apos;t catalogued this candidate&apos;s stances on the
          issues yet — their site below has the details.
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
