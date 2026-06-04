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
  | "city_council";

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

export interface SelectedDistricts {
  state_senate?: string;
  state_assembly?: string;
  us_house?: string;
  city_council?: string;
}

export interface QuizAnswers {
  [questionId: string]: number;
}

export interface VotingPlan {
  registered: boolean;
  knowsRaces: boolean;
  hasPlan: boolean;
}
