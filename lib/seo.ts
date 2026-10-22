/**
 * Search and answer-engine metadata: page names, JSON-LD builders, and the
 * site facts they share. Nothing here renders visible UI.
 */
import { CERTIFICATION, keyDates } from "@/lib/data";
import type { Candidate, District, Office, Proposal } from "@/lib/types";

export const SITE_URL = "https://ballotnyc.org";
export const SITE_NAME = "Ballot NYC";
export const CONTACT_EMAIL = "hello@ballotnyc.org";
/** Bump when page copy or voter guidance changes (feeds sitemap lastModified). */
export const CONTENT_UPDATED = "2026-10-22";

export const SITE_DESCRIPTION =
  "Free, nonpartisan guide to the Nov 3, 2026 general election in New York City. Enter an address to see every race on your ballot (Governor, Attorney General, Comptroller, Congress, State Senate, Assembly, State Supreme Court) and the five NYC Charter ballot proposals, plus registration, early voting and mail ballot deadlines.";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export const abs = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

// ---------- Race naming ----------

const STATEWIDE_NAMES: Record<string, string> = {
  governor: "New York Governor",
  attorney_general: "New York Attorney General",
  comptroller: "New York State Comptroller",
};

function districtNumber(d: District): string {
  return d.id.replace(/^[a-z]+-/, "");
}

/** Short, search-style name: "NY-10 U.S. House", "NY State Senate District 26". */
export function raceSearchName(office: Office, district: District): string {
  switch (district.type) {
    case "statewide":
      return STATEWIDE_NAMES[office.id] ?? `New York ${office.title}`;
    case "us_house":
      return `NY-${districtNumber(district)} U.S. House`;
    case "state_senate":
      return `NY State Senate District ${districtNumber(district)}`;
    case "state_assembly":
      return `NY Assembly District ${districtNumber(district)}`;
    case "judicial":
      return district.borough
        ? `${district.borough} State Supreme Court Justice`
        : `${district.name} State Supreme Court Justice`;
    default:
      return `${office.title}, ${district.name}`;
  }
}

/** Longer descriptive name used in descriptions and structured data. */
export function raceLongName(office: Office, district: District): string {
  if (district.type === "statewide") return STATEWIDE_NAMES[office.id] ?? office.title;
  if (district.type === "us_house")
    return `New York's ${ordinal(Number(districtNumber(district)))} Congressional District (U.S. House District ${districtNumber(district)})`;
  if (district.type === "judicial") return `State Supreme Court Justice, ${district.name}`;
  return `${office.title}, ${district.name}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function candidateLabel(c: Candidate): string {
  const lines = c.lines?.length ? c.lines : c.party ? [c.party] : [];
  const mate = c.runningMate ? ` with ${c.runningMate} for Lt. Governor` : "";
  return lines.length ? `${c.name}${mate} (${lines.join(", ")})` : `${c.name}${mate}`;
}

// ---------- JSON-LD ----------

type Json = Record<string, unknown>;

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    logo: `${SITE_URL}/apple-icon`,
    description:
      "Free, nonpartisan, ad-free voter guide for New York City elections.",
    founder: { "@type": "Person", name: "Ian Taylor" },
    areaServed: { "@type": "City", name: "New York City" },
  };
}

export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    alternateName: "ballotnyc.org",
    url: SITE_URL,
    inLanguage: "en-US",
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORG_ID },
  };
}

const NYC_PLACE = {
  "@type": "Place",
  name: "Your assigned poll site in New York City",
  url: "https://findmypollsite.vote.nyc/",
  address: {
    "@type": "PostalAddress",
    addressLocality: "New York",
    addressRegion: "NY",
    addressCountry: "US",
  },
};

const NYC_BOE = {
  "@type": "GovernmentOrganization",
  name: "Board of Elections in the City of New York",
  url: "https://vote.nyc/",
};

const dateOf = (id: string) => keyDates.find((d) => d.id === id)?.date.slice(0, 10);

/** Election Day and the early-voting period as schema.org Events. */
export function electionEventsLd(): Json[] {
  const day = dateOf("election-day");
  const earlyStart = dateOf("early-start");
  const earlyEnd = dateOf("early-end");
  const events: Json[] = [];
  if (day) {
    events.push({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "New York General Election — Election Day (New York City)",
      description:
        "General Election for Governor, Attorney General, Comptroller, U.S. House, State Senate, State Assembly, State Supreme Court and five NYC Charter ballot proposals. Polls are open 6 AM to 9 PM at your assigned poll site.",
      // Nov 3, 2026 is after DST ends (Nov 1), so New York is UTC−5.
      startDate: `${day}T06:00:00-05:00`,
      endDate: `${day}T21:00:00-05:00`,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      isAccessibleForFree: true,
      location: NYC_PLACE,
      organizer: NYC_BOE,
      url: abs("/dates"),
    });
  }
  if (earlyStart && earlyEnd) {
    events.push({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Early voting for the New York General Election (New York City)",
      description:
        "Nine days of in-person early voting. NYC voters are assigned one early voting site, which can differ from their Election Day poll site.",
      startDate: earlyStart,
      endDate: earlyEnd,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      isAccessibleForFree: true,
      location: NYC_PLACE,
      organizer: NYC_BOE,
      url: abs("/dates"),
    });
  }
  return events;
}

export function faqLd(items: Array<{ q: string; a: string }>, url: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function proposalFaq(p: Proposal): { q: string; a: string } {
  return {
    q: `What is NYC Ballot Question ${p.number} (2026), "${p.title}"?`,
    a: `${p.headline}. ${p.changes.join(" ")} A YES vote: ${p.yesMeans} A NO vote: ${p.noMeans}`,
  };
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

/** The race page as a WebPage whose main entity is the ordered candidate list. */
export function raceLd(
  office: Office,
  district: District,
  candidates: Candidate[],
  path: string,
  seats: number,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: abs(path),
    name: `${raceSearchName(office, district)} race — Nov 3, 2026`,
    about: raceLongName(office, district),
    isPartOf: { "@id": SITE_ID },
    publisher: { "@id": ORG_ID },
    dateModified: CERTIFICATION.date,
    citation: CERTIFICATION.url,
    mainEntity: {
      "@type": "ItemList",
      name: `Candidates on the Nov 3, 2026 ballot: ${raceLongName(office, district)}${seats > 1 ? ` (vote for up to ${seats})` : ""}`,
      numberOfItems: candidates.length,
      itemListElement: candidates.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Person",
          name: c.name,
          description: c.lines?.length
            ? `On the ${c.lines.join(", ")} line${c.lines.length > 1 ? "s" : ""}`
            : undefined,
        },
      })),
    },
  };
}
