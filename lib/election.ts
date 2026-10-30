import dates from "../data/keyDates.json";
import { nyTime, nyToday, pollsClose } from "./nyTime";
import type { KeyDate, VotingPlan } from "./types";

/** One historical election, with deadlines evaluated in New York time. */
export const electionDates = dates as KeyDate[];
export function deadline(id: string): KeyDate {
  const date = electionDates.find((d) => d.id === id);
  if (!date) throw new Error(`Missing election deadline: ${id}`);
  return date;
}
export const ELECTION = {
  year: 2026,
  day: deadline("election-day").date,
  registration: deadline("register").date,
  addressChange: deadline("address-change").date,
  earlyStart: deadline("early-start").date,
  earlyEnd: deadline("early-end").date,
  source: "https://elections.ny.gov/registration-and-voting-deadlines",
  hoursSource: "https://vote.nyc/elections",
  pollSite: "https://findmypollsite.vote.nyc/",
  registrationLookup: "https://voterlookup.elections.ny.gov/",
  board: "https://vote.nyc/page/borough-offices",
} as const;

export const shortDate = (date: string) => new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", timeZone: "UTC",
}).format(new Date(`${date}T12:00:00Z`));

function tomorrow(date: string) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
}
export function deadlineCutoff(d: KeyDate): number {
  if (d.id === "election-day") return pollsClose(d.date);
  if (d.id === "early-end") return nyTime(d.date, 17); // NYC BOE, final day closes at 5 PM.
  return nyTime(tomorrow(d.date));
}
export function deadlineStatus(d: KeyDate, now: number): "upcoming" | "today" | "passed" {
  if (now >= deadlineCutoff(d)) return "passed";
  return nyToday(now) === d.date ? "today" : "upcoming";
}
export function electionState(now: number) {
  const archived = now >= pollsClose(ELECTION.day);
  const early = now >= nyTime(ELECTION.earlyStart) && now < deadlineCutoff(deadline("early-end"));
  return {
    archived,
    early,
    electionDay: !archived && nyToday(now) === ELECTION.day,
    registrationPassed: deadlineStatus(deadline("register"), now) === "passed",
    addressChangePassed: deadlineStatus(deadline("address-change"), now) === "passed",
  };
}

/** Refresh open tabs at midnight and at voting cutoffs, including after sleep. */
export function nextElectionBoundary(now: number): number {
  return Math.min(...[
    nyTime(tomorrow(nyToday(now))),
    ...electionDates.flatMap((d) => [nyTime(d.date), deadlineCutoff(d)]),
  ].filter((t) => t > now));
}

export function movedVoterGuidance(now: number): string {
  const s = electionState(now);
  const timing = s.addressChangePassed
    ? `The ${shortDate(ELECTION.addressChange)} address-change processing date has passed.`
    : `Address changes received at least 15 days before Election Day — ${shortDate(ELECTION.addressChange)} for this election — must be processed in time.`;
  return `Already registered and moved? Update your address rather than treating it as a new registration. ${timing} Missing that processing date does not automatically make you ineligible. Check your registration record and ask your county Board of Elections where and how to vote. Moving can change your races.`;
}

export type PlanStep = {
  key: keyof VotingPlan; num: string; title: string; body: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  note?: { label: string; href: string };
};
export function planSteps(now: number): PlanStep[] {
  const s = electionState(now);
  const registration = s.archived
    ? `The ${shortDate(ELECTION.day)}, ${ELECTION.year} election has ended. New registration for that election closed ${shortDate(ELECTION.registration)}. Check your current registration and the Board of Elections for future elections.`
    : s.registrationPassed
      ? `The new-registration deadline for this election passed on ${shortDate(ELECTION.registration)}. If you are already registered, check your existing record. For questions about your eligibility, use official Board of Elections guidance.`
      : `New to New York voter registration? Your application must be received by ${shortDate(ELECTION.registration)}${nyToday(now) === ELECTION.registration ? " (today)" : ""} for this election. Already registered? Check your record.`;
  const voting = s.archived
    ? `In-person voting for the ${shortDate(ELECTION.day)}, ${ELECTION.year} election has ended. This guide is archived. See the official Board of Elections for results, remaining mail-ballot information, and future elections.`
    : s.early
      ? `The early-voting period runs through ${shortDate(ELECTION.earlyEnd)} (5 PM on the final day). Hours vary by day. NYC assigns you one early voting site; it may differ from your Election Day site. Election Day is ${shortDate(ELECTION.day)}, 6 AM–9 PM.`
      : now >= deadlineCutoff(deadline("early-end"))
        ? `Early voting has ended. Election Day is ${shortDate(ELECTION.day)}, 6 AM–9 PM. Check your assigned Election Day site. If you are in line when polls close, stay in line.`
        : `Early voting runs ${shortDate(ELECTION.earlyStart)}–${shortDate(ELECTION.earlyEnd)}; hours vary. Election Day is ${shortDate(ELECTION.day)}, 6 AM–9 PM. NYC assigns one early voting site, which may differ from your Election Day site.`;
  return [
    { key: "registered", num: "01", title: s.registrationPassed ? "Check your registration." : "Register or check your record.",
      body: `${registration} ${movedVoterGuidance(now)}`,
      cta: s.registrationPassed
        ? { label: "Check my registration →", href: ELECTION.registrationLookup }
        : { label: "Register to vote →", href: deadline("register").actionUrl! },
      secondary: { label: "Official registration and address-update guidance →", href: ELECTION.source } },
    { key: "knowsRaces", num: "02", title: s.archived ? "Explore the 2026 guide." : "Know your races.",
      body: "Explore the races and proposals in our independent guide, then verify the complete contests on your official sample ballot. The guide does not verify registration or eligibility.",
      cta: { label: "Open my ballot guide →", href: "/ballot" } },
    { key: "hasPlan", num: "03", title: s.archived ? "Check official election information." : "Pick when, where, how.", body: voting,
      cta: { label: s.archived ? "Official election information →" : "Find my poll sites →", href: s.archived ? ELECTION.hoursSource : ELECTION.pollSite },
      secondary: { label: "Official mail-ballot options and deadlines →", href: "https://elections.ny.gov/request-ballot" },
      note: { label: "Official voting dates and hours →", href: ELECTION.hoursSource } },
  ];
}
