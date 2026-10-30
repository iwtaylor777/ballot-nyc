/**
 * /llms.txt — a plain-text brief of the whole guide for AI assistants and
 * answer engines (most don't run JavaScript, so they can't read the
 * interactive pages). Generated from the same data the site renders.
 */
import {
  CERTIFICATION,
  certifiedRaceKeys,
  getCandidatesForRace,
  getDistrict,
  keyDates,
  offices,
  proposals,
  seatsForRace,
} from "@/lib/data";
import { getVoterFaq } from "@/lib/faq";
import { electionState } from "@/lib/election";
import {
  CONTACT_EMAIL,
  CONTENT_UPDATED,
  SITE_DESCRIPTION,
  SITE_URL,
  candidateLabel,
  raceLongName,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const DAY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const LONG = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function racesSection(): string {
  const keys = certifiedRaceKeys();
  const out: string[] = [];
  for (const office of offices) {
    const mine = keys.filter((k) => k.officeId === office.id);
    if (mine.length === 0) continue;
    out.push(`### ${office.title}`, "");
    if (office.stakes.length) out.push(`What it controls: ${office.stakes.join("; ")}.`, "");
    for (const k of mine) {
      const district = getDistrict(k.districtId);
      if (!district) continue;
      const cands = getCandidatesForRace(k.officeId, k.districtId);
      const seats = seatsForRace(k.officeId, k.districtId);
      const seatNote = seats > 1 ? ` (vote for up to ${seats})` : "";
      out.push(
        `- [${raceLongName(office, district)}](${SITE_URL}/race/${office.id}/${district.id})${seatNote}: ${
          cands.length ? cands.map(candidateLabel).join("; ") : "see official sample ballot"
        }`,
      );
    }
    out.push("");
  }
  return out.join("\n");
}

export function GET() {
  const now = Date.now();
  const FAQ = getVoterFaq(now);
  const archived = electionState(now).archived;
  const body = `# Ballot NYC

> ${SITE_DESCRIPTION}

${archived ? "ARCHIVED: in-person voting for the November 3, 2026 election has ended. This is historical guide content; check vote.nyc for current elections." : "This guide concerns the November 3, 2026 election. Check the dated deadlines below against today in America/New_York."}

Ballot NYC (${SITE_URL}) is free, nonpartisan and ad-free. It does not endorse candidates or positions. Candidate lists come from the ${CERTIFICATION.source} (${CERTIFICATION.url}). Candidate positions are published only where a public source can be linked. Last updated ${LONG.format(new Date(CONTENT_UPDATED))}.

Coverage: the five boroughs of New York City (Manhattan, Brooklyn, Queens, the Bronx, Staten Island). For local contests not listed here, voters should check their official sample ballot from the NYC Board of Elections (https://vote.nyc/).

## Key pages

- [Look up your ballot by address](${SITE_URL}/onboarding): covered races and proposals; not proof of registration, eligibility, or a complete official sample ballot.
- [NYC ballot proposals 1–5](${SITE_URL}/proposals): what each City Charter proposal changes and what Yes/No means.
- [Key dates and deadlines](${SITE_URL}/dates): registration, early voting, mail ballots, Election Day.
- [Voting plan and FAQs](${SITE_URL}/plan): how to vote in NYC, voter ID, moving, poll hours.
- [Issue match quiz](${SITE_URL}/quiz): compares a voter's answers with candidates' sourced positions.
- [For newsrooms](${SITE_URL}/partners): free embeddable ballot lookup.

- [Browse races by office and district](${SITE_URL}/races): existing public race pages; no address needed.
- [About, sources, methodology and corrections](${SITE_URL}/about).
- [Privacy and saved data](${SITE_URL}/privacy).

## Key dates — Nov 3, 2026 general election (New York City)

${keyDates
  .map((d) => `- ${DAY.format(new Date(d.date))}: ${d.label}${d.note ? ` — ${d.note}` : ""}${d.actionUrl ? ` (${d.actionUrl})` : ""}`)
  .join("\n")}

Official tools: register or update your address at https://elections.ny.gov/register-vote; check registration at https://voterlookup.elections.ny.gov/; find your early voting and Election Day poll sites at https://findmypollsite.vote.nyc/; request a mail ballot at https://nycabsentee.com/.

## Voter FAQs

${FAQ.map((f) => `**${f.q}** ${f.a}`).join("\n\n")}

## NYC ballot proposals (on every NYC ballot)

Five City Charter questions proposed by the 2026 Charter Revision Commission. They are usually printed on the back of the ballot. Summaries are drawn from the Commission's official abstracts.

${proposals
  .map(
    (p) => `### Question ${p.number}: ${p.headline}

Official title: ${p.title}

${p.changes.map((c) => `- ${c}`).join("\n")}

- A YES vote: ${p.yesMeans}
- A NO vote: ${p.noMeans}
- Source: ${p.sourceUrl}
- More: ${SITE_URL}/proposals#q${p.number}`,
  )
  .join("\n\n")}

## Races and certified candidates

Format: race — candidate (ballot lines). New York allows fusion voting: a candidate may appear on several party lines and a vote on any of them counts once.

${racesSection()}
## Contact and corrections

Email ${CONTACT_EMAIL}. Include the affected page and a supporting source when possible.
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
