import districtsRaw from "@/data/districts.json";
import officesRaw from "@/data/offices.json";
import candidatesRaw from "@/data/candidates.json";
import quizRaw from "@/data/quiz.json";
import keyDatesRaw from "@/data/keyDates.json";
import type {
  Candidate,
  District,
  DistrictType,
  KeyDate,
  Office,
  QuizQuestion,
  SelectedDistricts,
} from "./types";

export const districts = districtsRaw as District[];
export const offices = officesRaw as Office[];
export const candidates = candidatesRaw as Candidate[];
export const quiz = quizRaw as QuizQuestion[];
export const keyDates = keyDatesRaw as KeyDate[];

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

export function getCandidatesForRace(
  officeId: string,
  districtId: string,
): Candidate[] {
  return candidates.filter(
    (c) => c.officeId === officeId && c.districtId === districtId,
  );
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
  ];
  for (const type of order) {
    const districtId = selected[type as keyof SelectedDistricts];
    if (!districtId) continue;
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
