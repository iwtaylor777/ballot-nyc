import districtsRaw from "@/data/districts.json";
import officesRaw from "@/data/offices.json";
import candidatesRaw from "@/data/candidates.json";
import quizRaw from "@/data/quiz.json";
import keyDatesRaw from "@/data/keyDates.json";
import certifiedRaw from "@/data/certified.json";
import proposalsRaw from "@/data/proposals.json";
import type {
  Candidate,
  District,
  DistrictType,
  KeyDate,
  Office,
  Proposal,
  QuizQuestion,
  SelectedDistricts,
} from "./types";

export const districts = districtsRaw as District[];
export const offices = officesRaw as Office[];
export const candidates = candidatesRaw as Candidate[];
export const quiz = quizRaw as QuizQuestion[];
export const keyDates = keyDatesRaw as KeyDate[];
export const proposals = proposalsRaw as Proposal[];

interface CertifiedRace {
  officeId: string;
  districtId: string;
  /** Number of seats (judicial races elect several at once). */
  voteFor?: number;
  candidates: { name: string; lines: string[]; runningMate?: string }[];
}

interface CertifiedDoc {
  _source: string;
  _sourceUrl: string;
  certifiedOn: string;
  races: CertifiedRace[];
}

const certified = certifiedRaw as CertifiedDoc;

export const CERTIFICATION = {
  source: certified._source,
  url: certified._sourceUrl,
  date: certified.certifiedOn,
};

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv"]);

/** "Michael J. LiPetri Jr" → { first: "m", last: "lipetri" } */
function nameKey(name: string): { first: string; last: string } {
  const parts = name
    .toLowerCase()
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter((p) => !SUFFIXES.has(p));
  return { first: parts[0]?.[0] ?? "", last: parts[parts.length - 1] ?? "" };
}

function samePerson(a: string, b: string): boolean {
  const x = nameKey(a);
  const y = nameKey(b);
  return x.last === y.last && x.first === y.first;
}

const certifiedByRace = new Map(
  certified.races.map((r) => [`${r.officeId}|${r.districtId}`, r]),
);

export function hasCertifiedList(officeId: string, districtId: string): boolean {
  return certifiedByRace.has(`${officeId}|${districtId}`);
}

/** How many candidates a voter may pick in this race. */
export function seatsForRace(officeId: string, districtId: string): number {
  return certifiedByRace.get(`${officeId}|${districtId}`)?.voteFor ?? 1;
}

export function certifiedRaceKeys(): Array<{ officeId: string; districtId: string }> {
  return certified.races.map(({ officeId, districtId }) => ({ officeId, districtId }));
}

const BOROUGH_TO_JUDICIAL: Record<string, string> = {
  Manhattan: "jd-1",
  Brooklyn: "jd-2",
  Queens: "jd-11",
  Bronx: "jd-12",
  "Staten Island": "jd-13",
};

export function judicialDistrictForBorough(borough?: string): string | undefined {
  return borough ? BOROUGH_TO_JUDICIAL[borough] : undefined;
}

/**
 * Districts we actually have a certified ballot for — i.e. the ones inside
 * New York City. Everything the user can pick, and everything we render, is
 * limited to these so nobody gets a plausible-looking ballot we can't stand
 * behind.
 */
const COVERED_DISTRICT_IDS = new Set(
  certified.races.map((r) => r.districtId).filter((id) => id !== "statewide-ny"),
);

export function isCoveredDistrict(districtId: string): boolean {
  return districtId === "statewide-ny" || COVERED_DISTRICT_IDS.has(districtId);
}

export function coveredDistricts(type: DistrictType): District[] {
  return districts.filter((d) => d.type === type && isCoveredDistrict(d.id));
}

/** Selected districts we don't cover (e.g. saved from an older session). */
export function unsupportedSelections(selected: SelectedDistricts): District[] {
  return Object.values(selected)
    .filter((id): id is string => typeof id === "string")
    .filter((id) => !isCoveredDistrict(id))
    .map((id) => getDistrict(id))
    .filter((d): d is District => d !== undefined);
}

export function getDistrictsByType(type: DistrictType): District[] {
  return districts.filter((d) => d.type === type);
}

export function getDistrict(id: string): District | undefined {
  return districts.find((d) => d.id === id);
}

export function getOffice(id: string): Office | undefined {
  return offices.find((o) => o.id === id);
}

/**
 * The next election users can act on right now — primary or general,
 * whichever is sooner. Falls back to election day if all primaries are
 * past.
 */
export function nextElection(now: Date = new Date()): KeyDate {
  const electionDays = keyDates.filter(
    (d) => d.id === "primary-day" || d.id === "election-day",
  );
  const upcoming = electionDays
    .filter((d) => new Date(d.date).getTime() + 86_400_000 > now.getTime())
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? electionDays[electionDays.length - 1];
}

/**
 * Who is on the November ballot for a race. The NYS Board of Elections
 * certification is the source of truth for *who* is running and on which
 * party lines; our curated candidates.json adds summaries and sourced
 * positions where we have them. Curated candidates who aren't certified
 * (e.g. lost a primary, never qualified) are not shown.
 */
export function getCandidatesForRace(
  officeId: string,
  districtId: string,
): Candidate[] {
  const curated = candidates.filter(
    (c) => c.officeId === officeId && c.districtId === districtId,
  );
  const race = certifiedByRace.get(`${officeId}|${districtId}`);
  if (!race) return curated;

  return race.candidates.map((cert, i) => {
    const match = curated.find((c) => samePerson(c.name, cert.name));
    const party = cert.lines[0] ?? match?.party ?? "";
    if (match) {
      return {
        ...match,
        name: cert.name,
        party,
        lines: cert.lines,
        runningMate: cert.runningMate,
        contest: "general" as const,
      };
    }
    return {
      id: `cert-${officeId}-${districtId}-${i}`,
      officeId,
      districtId,
      name: cert.name,
      party,
      lines: cert.lines,
      runningMate: cert.runningMate,
      incumbent: false,
      oneLiner: "",
      positions: [],
      sourceUrl: CERTIFICATION.url,
      contest: "general" as const,
      certifiedOnly: true,
    };
  });
}

/** Curated candidates that don't appear on the certified ballot (for audits). */
export function uncertifiedCurated(): Candidate[] {
  return candidates.filter((c) => {
    const race = certifiedByRace.get(`${c.officeId}|${c.districtId}`);
    return race && !race.candidates.some((k) => samePerson(k.name, c.name));
  });
}

/**
 * Build the personalized ballot — the ordered list of (office, district)
 * pairs the user will vote on, based on their district selections.
 * Statewide offices apply to everyone.
 */
export interface BallotRace {
  office: Office;
  district: District;
  candidates: Candidate[];
}

export function buildBallot(selected: SelectedDistricts): BallotRace[] {
  const statewide = getDistrict("statewide-ny");
  const races: BallotRace[] = [];

  // Statewide first
  for (const office of offices) {
    if (office.scope === "statewide" && statewide) {
      races.push({
        office,
        district: statewide,
        candidates: getCandidatesForRace(office.id, statewide.id),
      });
    }
  }

  // Then district races, in a stable order
  const order: DistrictType[] = [
    "us_house",
    "state_senate",
    "state_assembly",
    "city_council",
    "judicial",
  ];
  for (const type of order) {
    const districtId = selected[type as keyof SelectedDistricts];
    if (!districtId) continue;
    if (!isCoveredDistrict(districtId)) continue;
    const district = getDistrict(districtId);
    if (!district) continue;
    const office = offices.find((o) => o.scope === type);
    if (!office) continue;
    races.push({
      office,
      district,
      candidates: getCandidatesForRace(office.id, district.id),
    });
  }

  return races;
}
