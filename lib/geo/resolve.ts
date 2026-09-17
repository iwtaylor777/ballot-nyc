/**
 * Address → legislative districts. Runs server-side (the Census geocoder
 * doesn't send CORS headers).
 *
 * Pipeline:
 *  1. Parse + normalize the input (Queens hyphens, units, locality hints).
 *  2. Look it up in NYC's own address directory (GeoSearch). Only accept a
 *     result whose house number AND street match what was typed.
 *  3. Turn the building's coordinates into districts with the Census
 *     geographies/coordinates endpoint (no address matching involved).
 *  4. If NYC's directory has no exact match, fall back to the Census
 *     address matcher with borough/ZIP variants it can understand.
 *  5. Never silently substitute a different building: ambiguous or
 *     nearby-only results come back as choices for the user.
 */

import type { SelectedDistricts } from "../types";
import {
  BOROUGHS,
  CENSUS_CITY,
  compareStreets,
  houseKey,
  parseAddress,
  prettyStreet,
  type Borough,
  type ParsedAddress,
} from "./address";
import {
  distinctBoroughs,
  geosearch,
  geosearchQuery,
  rankPlaces,
  type Place,
} from "./places";

const CENSUS = "https://geocoding.geo.census.gov/geocoder/geographies";
const CENSUS_PARAMS = {
  benchmark: "Public_AR_Current",
  vintage: "Current_Current",
  format: "json",
};

// Loose bounding box for New York State; coordinates outside it are rejected.
const NY_BBOX = { minLat: 40.4, maxLat: 45.1, minLon: -79.9, maxLon: -71.7 };

export type FetchJson = (url: string) => Promise<unknown>;

export interface MatchedAddress {
  label: string;
  houseNumber?: string;
  street?: string;
  borough?: Borough;
  zip?: string;
}

export type ResolveResult =
  | {
      status: "match";
      address: MatchedAddress;
      districts: SelectedDistricts;
      warnings: string[];
      source: "nyc" | "census";
    }
  | {
      status: "choose";
      reason: "ambiguous" | "nearby";
      message: string;
      choices: Place[];
    }
  | {
      status: "not_found";
      reason: "no_number" | "zip_only" | "too_short" | "no_match";
      message: string;
    }
  | { status: "outside_ny"; message: string };

interface CensusGeography {
  BASENAME?: string;
  GEOID?: string;
}

interface CensusMatch {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  addressComponents?: {
    state?: string;
    zip?: string;
    city?: string;
    streetName?: string;
    preType?: string;
    suffixType?: string;
    preDirection?: string;
    suffixDirection?: string;
  };
  geographies?: Record<string, CensusGeography[]>;
}

function pick(
  geographies: Record<string, CensusGeography[]>,
  test: (key: string) => boolean,
): CensusGeography | undefined {
  for (const key of Object.keys(geographies)) {
    if (!test(key.toLowerCase())) continue;
    const list = geographies[key];
    if (Array.isArray(list) && list.length > 0) return list[0];
  }
  return undefined;
}

function districtNumber(g: CensusGeography | undefined): string | undefined {
  const n = Number.parseInt(g?.BASENAME ?? "", 10);
  return Number.isFinite(n) && n > 0 ? String(n) : undefined;
}

// NYC county FIPS → borough → judicial district.
const COUNTY_TO_BOROUGH: Record<string, Borough> = {
  "36061": "Manhattan",
  "36047": "Brooklyn",
  "36081": "Queens",
  "36005": "Bronx",
  "36085": "Staten Island",
};

const JUDICIAL: Record<Borough, string> = {
  Manhattan: "jd-1",
  Brooklyn: "jd-2",
  Queens: "jd-11",
  Bronx: "jd-12",
  "Staten Island": "jd-13",
};

export function boroughFromGeographies(
  geographies: Record<string, CensusGeography[]>,
): Borough | undefined {
  const county = pick(geographies, (k) => k === "counties");
  return county?.GEOID ? COUNTY_TO_BOROUGH[county.GEOID] : undefined;
}

export function districtsFromGeographies(
  geographies: Record<string, CensusGeography[]>,
): { districts: SelectedDistricts; warnings: string[]; borough?: Borough } {
  const cd = districtNumber(pick(geographies, (k) => k.includes("congressional")));
  const upper = districtNumber(
    pick(geographies, (k) => k.includes("legislative") && k.includes("upper")),
  );
  const lower = districtNumber(
    pick(geographies, (k) => k.includes("legislative") && k.includes("lower")),
  );
  const districts: SelectedDistricts = {};
  const warnings: string[] = [];
  if (cd) districts.us_house = `ush-${cd}`;
  else warnings.push("Could not resolve your U.S. House district.");
  if (upper) districts.state_senate = `ss-${upper}`;
  else warnings.push("Could not resolve your State Senate district.");
  if (lower) districts.state_assembly = `ad-${lower}`;
  else warnings.push("Could not resolve your State Assembly district.");
  const borough = boroughFromGeographies(geographies);
  if (borough) districts.judicial = JUDICIAL[borough];
  return { districts, warnings, borough };
}

export function inNewYork(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= NY_BBOX.minLat &&
    lat <= NY_BBOX.maxLat &&
    lon >= NY_BBOX.minLon &&
    lon <= NY_BBOX.maxLon
  );
}

export async function districtsForPoint(
  lat: number,
  lon: number,
  fetchJson: FetchJson,
): Promise<{
  districts: SelectedDistricts;
  warnings: string[];
  borough?: Borough;
  state?: string;
}> {
  const url = new URL(`${CENSUS}/coordinates`);
  url.searchParams.set("x", String(lon));
  url.searchParams.set("y", String(lat));
  for (const [k, v] of Object.entries(CENSUS_PARAMS)) url.searchParams.set(k, v);
  const data = (await fetchJson(url.toString())) as {
    result?: { geographies?: Record<string, (CensusGeography & { STUSAB?: string })[]> };
  };
  const geos = data.result?.geographies ?? {};
  const state = geos["States"]?.[0]?.STUSAB;
  return { ...districtsFromGeographies(geos), state };
}

async function censusAddress(
  oneLine: string,
  fetchJson: FetchJson,
): Promise<CensusMatch[]> {
  const url = new URL(`${CENSUS}/onelineaddress`);
  url.searchParams.set("address", oneLine);
  for (const [k, v] of Object.entries(CENSUS_PARAMS)) url.searchParams.set(k, v);
  const data = (await fetchJson(url.toString())) as {
    result?: { addressMatches?: CensusMatch[] };
  };
  return data.result?.addressMatches ?? [];
}

function censusBorough(m: CensusMatch): Borough | undefined {
  const city = m.addressComponents?.city?.toUpperCase();
  if (!city) return undefined;
  if (city === "NEW YORK") return "Manhattan";
  if (city === "BROOKLYN") return "Brooklyn";
  if (city === "BRONX") return "Bronx";
  if (city === "STATEN ISLAND") return "Staten Island";
  return undefined; // Queens postal cities vary; leave unset.
}

function censusStreet(m: CensusMatch): string {
  const c = m.addressComponents ?? {};
  return [c.preDirection, c.preType, c.streetName, c.suffixType, c.suffixDirection]
    .filter(Boolean)
    .join(" ");
}

function censusToAddress(m: CensusMatch): MatchedAddress {
  const c = m.addressComponents ?? {};
  const hn = (m.matchedAddress ?? "").match(/^(\d+[A-Z]?(?:-\d+[A-Z]?)?)\s/i)?.[1];
  const street = [c.preDirection, c.preType, c.streetName, c.suffixType, c.suffixDirection]
    .filter(Boolean)
    .join(" ");
  // "88-15 PARSONS BLVD, JAMAICA, NY, 11432" → "88-15 Parsons Blvd, Jamaica, NY 11432"
  const [line1 = "", city = "", state = "", zip = ""] = (m.matchedAddress ?? "")
    .split(",")
    .map((s) => s.trim());
  const streetPart = hn ? line1.slice(hn.length).trim() : line1;
  const label = [
    [hn, prettyStreet(streetPart)].filter(Boolean).join(" "),
    prettyStreet(city),
    [state, zip].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return {
    label,
    houseNumber: hn,
    street: street || undefined,
    borough: censusBorough(m),
    zip: c.zip,
  };
}

function censusHouseKey(m: CensusMatch): string | undefined {
  const first = (m.matchedAddress ?? "").match(/^(\d+[A-Z]?(?:-\d+[A-Z]?)?)\s/i);
  return first ? houseKey(first[1]) : undefined;
}

/** Address strings the Census matcher can digest, most specific first. */
function censusVariants(parsed: ParsedAddress, nearby: Place[]): string[] {
  const line1 = `${parsed.houseNumber} ${parsed.street}`;
  const out: string[] = [];
  const add = (s: string) => {
    if (!out.includes(s)) out.push(s);
  };
  if (parsed.zip) add(`${line1}, NY ${parsed.zip}`);
  if (parsed.borough && CENSUS_CITY[parsed.borough]) {
    add(`${line1}, ${CENSUS_CITY[parsed.borough]}, NY`);
  }
  // ZIPs of nearby buildings on the same street — the only way to hand
  // Census a Queens address without a postal city.
  for (const z of Array.from(new Set(nearby.map((p) => p.zip).filter(Boolean))).slice(0, 2)) {
    add(`${line1}, NY ${z}`);
  }
  if (parsed.hasLocality && !parsed.borough && !parsed.weakManhattan) {
    // Something we don't recognize (a Queens postal city, or outside NYC).
    add(parsed.cleaned);
  }
  if (out.length === 0) {
    for (const b of BOROUGHS) {
      const city = CENSUS_CITY[b];
      if (city) add(`${line1}, ${city}, NY`);
    }
  }
  return out;
}

function placeLabelFromCensus(m: CensusMatch): Place | null {
  const lat = m.coordinates?.y;
  const lon = m.coordinates?.x;
  if (lat == null || lon == null) return null;
  const a = censusToAddress(m);
  return {
    label: a.label,
    line1: a.label.split(",")[0] ?? a.label,
    houseNumber: a.houseNumber ?? "",
    street: a.street ?? "",
    borough: a.borough,
    zip: a.zip,
    lat,
    lon,
  };
}

/** Lower-cased text after the first comma, minus state/ZIP ("yonkers"). */
function localityText(cleaned: string): string {
  const i = cleaned.indexOf(",");
  if (i < 0) return "";
  return cleaned
    .slice(i + 1)
    .toLowerCase()
    .replace(/\b\d{5}(-\d{4})?\b/g, "")
    .replace(/\bny\b|\bnew york\b/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Census matches for exactly the typed house number, one per building. */
async function censusExact(
  parsed: ParsedAddress,
  variants: string[],
  fetchJson: FetchJson,
): Promise<{ matches: CensusMatch[]; anyInState: boolean; anyResults: boolean; failed: number }> {
  const results = await Promise.allSettled(variants.map((v) => censusAddress(v, fetchJson)));
  const all: CensusMatch[] = [];
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
    else failed++;
  }
  const inState = all.filter(
    (m) => (m.addressComponents?.state ?? "NY").toUpperCase() === "NY",
  );
  // Same house number AND same street (Census fuzzy-matches street names).
  let exact = inState.filter(
    (m) =>
      censusHouseKey(m) === parsed.houseKey &&
      compareStreets(parsed.street ?? "", censusStreet(m)).score >= 10,
  );
  // If the user named a place we don't know ("Yonkers", "Forest Hills"),
  // prefer matches in that city.
  const typedPlace = localityText(parsed.cleaned);
  if (typedPlace) {
    const inCity = exact.filter((m) => {
      const city = (m.addressComponents?.city ?? "").toLowerCase();
      return city.length > 0 && typedPlace.includes(city);
    });
    if (inCity.length) exact = inCity;
  }
  // Census can return the same building twice ("100 …" and "1-00 …").
  const seen = new Set<string>();
  const unique: CensusMatch[] = [];
  for (const m of exact) {
    const c = m.addressComponents ?? {};
    const k = `${censusHouseKey(m)}|${c.zip ?? ""}|${(c.streetName ?? "").toLowerCase()}|${(c.suffixType ?? "").toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(m);
  }
  return {
    matches: unique,
    anyInState: inState.length > 0,
    anyResults: all.length > 0,
    failed,
  };
}

function censusMatchResult(m: CensusMatch): ResolveResult {
  const { districts, warnings, borough } = districtsFromGeographies(m.geographies ?? {});
  const address = censusToAddress(m);
  return {
    status: "match",
    address: { ...address, borough: address.borough ?? borough },
    districts,
    warnings,
    source: "census",
  };
}

function formatNumber(parsed: ParsedAddress): string {
  return `${parsed.houseNumber} ${prettyStreet(parsed.street ?? "")}`.trim();
}

export async function resolvePlace(
  place: { lat: number; lon: number } & Partial<MatchedAddress>,
  fetchJson: FetchJson,
): Promise<ResolveResult> {
  if (!inNewYork(place.lat, place.lon)) {
    return { status: "outside_ny", message: "That location isn't in New York State." };
  }
  const { districts, warnings, state, borough } = await districtsForPoint(
    place.lat,
    place.lon,
    fetchJson,
  );
  if (state && state !== "NY") {
    return { status: "outside_ny", message: "That location isn't in New York State." };
  }
  return {
    status: "match",
    address: {
      label: place.label ?? "",
      houseNumber: place.houseNumber,
      street: place.street,
      borough: place.borough ?? borough,
      zip: place.zip,
    },
    districts,
    warnings,
    source: "nyc",
  };
}

export async function resolveAddress(
  raw: string,
  deps: { fetchJson: FetchJson; fetchImpl?: typeof fetch },
): Promise<ResolveResult> {
  const parsed = parseAddress(raw);
  if (parsed.zipOnly) {
    return {
      status: "not_found",
      reason: "zip_only",
      message:
        "A ZIP code alone can span several districts. Add your street address (e.g. 365 Bond St).",
    };
  }
  if (parsed.cleaned.length < 5 || !parsed.street) {
    return {
      status: "not_found",
      reason: "too_short",
      message: "Type your street address, starting with the building number.",
    };
  }
  if (!parsed.houseNumber) {
    return {
      status: "not_found",
      reason: "no_number",
      message:
        "Start with your building number (e.g. 365 Bond St) — one street can cross several districts.",
    };
  }

  // 1. NYC's address directory.
  let ranked: { exact: Place[]; nearby: Place[]; hintMismatch: boolean } = {
    exact: [],
    nearby: [],
    hintMismatch: false,
  };
  try {
    const places = await geosearch("search", geosearchQuery(parsed), {
      size: 20,
      fetchImpl: deps.fetchImpl,
    });
    ranked = rankPlaces(parsed, places);
  } catch {
    // GeoSearch down — fall through to Census.
  }

  const line1 = `${parsed.houseNumber} ${parsed.street}`;

  if (ranked.hintMismatch && ranked.exact.length > 0) {
    // NYC's directory only has this address somewhere other than where the
    // user said. Ask Census about the place they named before offering it.
    const where =
      parsed.zip
        ? [`${line1}, NY ${parsed.zip}`]
        : parsed.borough && CENSUS_CITY[parsed.borough]
          ? [`${line1}, ${CENSUS_CITY[parsed.borough]}, NY`]
          : [];
    if (where.length) {
      const c = await censusExact(parsed, where, deps.fetchJson).catch(() => null);
      if (c && c.matches.length === 1) return censusMatchResult(c.matches[0]);
    }
    return {
      status: "choose",
      reason: "ambiguous",
      message: `We couldn't find ${formatNumber(parsed)} in ${parsed.borough ?? parsed.zip}. Is it one of these?`,
      choices: ranked.exact.slice(0, 5),
    };
  }

  if (ranked.exact.length === 1) {
    const only = ranked.exact[0];
    // No borough or ZIP given: NYC's directory doesn't list every address
    // (e.g. 250 West End Ave exists in Manhattan *and* Brooklyn, but only the
    // Brooklyn one is indexed). Cross-check the other boroughs with Census
    // before assuming.
    if (!parsed.borough && !parsed.zip) {
      const others = BOROUGHS.filter((b) => b !== only.borough && CENSUS_CITY[b]).map(
        (b) => `${line1}, ${CENSUS_CITY[b]}, NY`,
      );
      const c = await censusExact(parsed, others, deps.fetchJson).catch(() => null);
      const elsewhere = (c?.matches ?? [])
        .map(placeLabelFromCensus)
        .filter((p): p is Place => p !== null && p.borough !== undefined && p.borough !== only.borough);
      if (elsewhere.length > 0) {
        return {
          status: "choose",
          reason: "ambiguous",
          message: `${formatNumber(parsed)} exists in more than one borough. Which one is yours?`,
          choices: [only, ...elsewhere].slice(0, 5),
        };
      }
    }
    return resolvePlace(only, deps.fetchJson);
  }

  if (ranked.exact.length > 1) {
    const boroughs = distinctBoroughs(ranked.exact);
    return {
      status: "choose",
      reason: "ambiguous",
      message:
        boroughs.length > 1
          ? `${formatNumber(parsed)} exists in more than one borough. Which one is yours?`
          : `We found more than one ${formatNumber(parsed)}. Which one is yours?`,
      choices: ranked.exact.slice(0, 5),
    };
  }

  // 2. Census address matcher, with variants it understands.
  const variants = censusVariants(parsed, ranked.nearby);
  const census = await censusExact(parsed, variants, deps.fetchJson);
  if (census.anyResults && !census.anyInState) {
    return {
      status: "outside_ny",
      message: "That address isn't in New York. Ballot NYC only covers New York.",
    };
  }
  if (census.matches.length === 1) return censusMatchResult(census.matches[0]);
  if (census.matches.length > 1) {
    const choices = census.matches
      .map(placeLabelFromCensus)
      .filter((p): p is Place => p !== null);
    if (choices.length > 0) {
      return {
        status: "choose",
        reason: "ambiguous",
        message: `${formatNumber(parsed)} exists in more than one place. Which one is yours?`,
        choices: choices.slice(0, 5),
      };
    }
  }

  // 3. Nothing exact anywhere — offer the closest real buildings, clearly labeled.
  if (ranked.nearby.length > 0) {
    return {
      status: "choose",
      reason: "nearby",
      message: `We couldn't find ${formatNumber(parsed)} in NYC's address list. Double-check the number, or pick the closest building (usually the same districts).`,
      choices: ranked.nearby.slice(0, 3),
    };
  }

  if (census.failed === variants.length && variants.length > 0) {
    throw new Error("census unavailable");
  }

  return {
    status: "not_found",
    reason: "no_match",
    message:
      "We couldn't find that address. Check the building number and street — Queens addresses need the hyphen (37-17 30th St).",
  };
}
