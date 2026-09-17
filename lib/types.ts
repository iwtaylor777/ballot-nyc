export type IssueTag =
  | "rent_housing"
  | "transit_fares"
  | "public_safety"
  | "climate"
  | "education_tuition"
  | "cannabis"
  | "jobs_economy"
  | "healthcare"
  | "immigration";

export const ISSUE_LABELS: Record<IssueTag, string> = {
  rent_housing: "Rent & Housing",
  transit_fares: "Transit & Fares",
  public_safety: "Public Safety",
  climate: "Climate",
  education_tuition: "Education & Tuition",
  cannabis: "Cannabis",
  jobs_economy: "Jobs & Economy",
  healthcare: "Healthcare",
  immigration: "Immigration",
};

export type DistrictType =
  | "statewide"
  | "state_senate"
  | "state_assembly"
  | "us_house"
  | "city_council"
  | "judicial";

export interface District {
  id: string;
  type: DistrictType;
  name: string;
  borough?: string;
}

export interface Office {
  id: string;
  title: string;
  scope: DistrictType;
  /** 2–3 concrete things this office controls. Plain language. */
  stakes: string[];
  /** Optional: which districtType drives selection. Statewide offices apply to all users. */
  sampleFlag?: "__SAMPLE__";
}

export interface CandidatePosition {
  tag: IssueTag;
  summary: string;
  sourceUrl: string;
  /** Numeric position on shared 0-100 scale per issue (used by quiz). */
  value: number;
}

export interface Candidate {
  id: string;
  officeId: string;
  districtId: string;
  name: string;
  party: string;
  incumbent: boolean;
  photoUrl?: string;
  oneLiner: string;
  positions: CandidatePosition[];
  sourceUrl: string;
  sampleFlag?: "__SAMPLE__";
  /** Every ballot line (party) the candidate appears on, per the NYS BOE certification. */
  lines?: string[];
  /** Lt. Governor on the same ticket (governor race only). */
  runningMate?: string;
  /** True when we only have the certified name — no curated profile yet. */
  certifiedOnly?: boolean;
  /** "primary" = ran in the June 23 primary for a party nomination (now
      decided); "general" = on the November 3 general-election ballot. */
  contest?: "primary" | "general";
}

export interface QuizOption {
  label: string;
  value: number;
}

export interface QuizQuestion {
  id: string;
  tag: IssueTag;
  prompt: string;
  options: QuizOption[];
  learnMore?: { label: string; url: string };
}

export interface KeyDate {
  id: string;
  label: string;
  date: string; // ISO 8601
  note?: string;
  actionUrl?: string;
}

export interface Proposal {
  id: string;
  number: number;
  /** Official ballot title. */
  title: string;
  /** Short plain-language headline. */
  headline: string;
  /** What changes if it passes — factual, from the official abstract. */
  changes: string[];
  yesMeans: string;
  noMeans: string;
  sourceUrl: string;
}

export interface SelectedDistricts {
  /** Judicial district (one per borough) — drives State Supreme Court races. */
  judicial?: string;
  state_senate?: string;
  state_assembly?: string;
  us_house?: string;
  city_council?: string;
}

export interface HomeAddress {
  label: string;
  houseNumber?: string;
  street?: string;
  borough?: string;
  zip?: string;
}

export interface QuizAnswers {
  [questionId: string]: number;
}

export interface VotingPlan {
  registered: boolean;
  knowsRaces: boolean;
  hasPlan: boolean;
}
