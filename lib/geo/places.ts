/**
 * NYC address lookup against NYC Planning's GeoSearch
 * (https://geosearch.planninglabs.nyc) — a free, keyless, CORS-enabled
 * geocoder built on the city's own Property Address Directory (PAD).
 * Unlike OpenStreetMap-based services it knows every legal NYC address,
 * including hyphenated Queens numbers, so we use it for both autocomplete
 * and lookups.
 *
 * GeoSearch happily returns "fallback" results with a different house
 * number or street than the user typed. `rankPlaces` filters those out so
 * we never silently swap someone's address for a neighbor's.
 */

import {
  BOROUGHS,
  compareStreets,
  houseKey,
  prettyStreet,
  streetKey,
  type Borough,
  type ParsedAddress,
} from "./address";

export const GEOSEARCH = "https://geosearch.planninglabs.nyc/v2";

export interface Place {
  /** "365 Bond Street, Brooklyn, NY 11231" */
  label: string;
  /** "365 Bond Street" */
  line1: string;
  houseNumber: string;
  /** Street as NYC spells it ("BOND STREET"), used for poll-site deep links. */
  street: string;
  /** Unset only for Census fallback matches outside the five boroughs. */
  borough?: Borough;
  zip?: string;
  lat: number;
  lon: number;
}

interface GeoFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    housenumber?: string;
    street?: string;
    borough?: string;
    postalcode?: string;
    layer?: string;
  };
}

/**
 * GeoSearch echoes an un-hyphenated Queens number back as typed ("3717").
 * Queens numbers are block-hyphen-lot, so restore the hyphen for display
 * and for the Board of Elections poll-site link.
 */
export function formatHouseNumber(hn: string, borough?: string): string {
  if (borough === "Queens" && /^\d{4,5}$/.test(hn)) {
    return `${hn.slice(0, -2)}-${hn.slice(-2)}`;
  }
  return hn;
}

export function featureToPlace(f: GeoFeature): Place | null {
  const p = f.properties ?? {};
  const coords = f.geometry?.coordinates;
  if (!p.housenumber || !p.street || !coords) return null;
  const borough = BOROUGHS.find((b) => b === p.borough);
  if (!borough) return null;
  const houseNumber = formatHouseNumber(p.housenumber, borough);
  const line1 = `${houseNumber} ${prettyStreet(p.street)}`;
  const tail = [borough, ["NY", p.postalcode].filter(Boolean).join(" ")].join(", ");
  return {
    label: `${line1}, ${tail}`,
    line1,
    houseNumber,
    street: p.street,
    borough,
    zip: p.postalcode || undefined,
    lat: coords[1],
    lon: coords[0],
  };
}

export async function geosearch(
  endpoint: "search" | "autocomplete",
  text: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; size?: number } = {},
): Promise<Place[]> {
  const url = new URL(`${GEOSEARCH}/${endpoint}`);
  url.searchParams.set("text", text);
  if (opts.size) url.searchParams.set("size", String(opts.size));
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url.toString(), {
    signal: opts.signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`geosearch ${res.status}`);
  const data = (await res.json()) as { features?: GeoFeature[] };
  const out: Place[] = [];
  for (const feat of data.features ?? []) {
    const place = featureToPlace(feat);
    if (place) out.push(place);
  }
  return out;
}

/** Text we send to GeoSearch: cleaned, minus the "New York, NY" noise. */
export function geosearchQuery(parsed: ParsedAddress): string {
  if (!parsed.houseNumber || !parsed.street) return parsed.cleaned;
  const parts = [`${parsed.houseNumber} ${parsed.street}`];
  if (parsed.borough) parts.push(parsed.borough);
  if (parsed.zip) parts.push(parsed.zip);
  return parts.join(", ");
}

export interface RankedPlaces {
  /** Same house number and street as typed, best first, de-duplicated. */
  exact: Place[];
  /** Same street, different number — closest numbers first. Never auto-picked. */
  nearby: Place[];
  /**
   * True when the user named a borough/ZIP and none of the exact matches
   * are there (e.g. "365 Bond St, Manhattan" only exists in Brooklyn).
   * Callers must confirm instead of auto-picking.
   */
  hintMismatch: boolean;
}

function numericHouse(hn: string): number {
  const key = houseKey(hn).replace(/[a-z]/g, "");
  return Number.parseInt(key, 10) || 0;
}

function metersApart(a: Place, b: Place): number {
  const dLat = (a.lat - b.lat) * 111_320;
  const dLon = (a.lon - b.lon) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/**
 * PAD lists the same building under several spellings ("ST MARK'S PLACE",
 * "SAINT MARKS PLACE"). Collapse those so we only ask when the choices are
 * genuinely different places.
 */
function dedupe(places: Place[]): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const p of places) {
    const k = `${p.borough}|${houseKey(p.houseNumber)}|${streetKey(p.street)}`;
    if (seen.has(k)) continue;
    if (out.some((o) => o.borough === p.borough && houseKey(o.houseNumber) === houseKey(p.houseNumber) && metersApart(o, p) < 40)) {
      continue;
    }
    seen.add(k);
    out.push(p);
  }
  return out;
}

export function rankPlaces(parsed: ParsedAddress, places: Place[]): RankedPlaces {
  if (!parsed.houseKey || !parsed.street) {
    return { exact: [], nearby: [], hintMismatch: false };
  }
  const typedStreet = parsed.street;

  const scored = places.map((p) => ({ p, s: compareStreets(typedStreet, p.street) }));
  const sameStreet = scored.filter((x) => x.s.nameMatch);

  // score >= 10 means every typed name token matched and the street type /
  // direction didn't conflict (so "30th St" never becomes "30th Ave").
  let exact = sameStreet.filter(
    (x) => x.s.score >= 10 && houseKey(x.p.houseNumber) === parsed.houseKey,
  );
  // Apply explicit hints only when they leave something to show; otherwise
  // remember that what we found contradicts what the user typed.
  let hintMismatch = false;
  if (parsed.zip) {
    const z = exact.filter((x) => x.p.zip === parsed.zip);
    if (z.length) exact = z;
    else if (exact.length) hintMismatch = true;
  }
  if (parsed.borough) {
    const b = exact.filter((x) => x.p.borough === parsed.borough);
    if (b.length) exact = b;
    else if (exact.length) hintMismatch = true;
  }
  const best = Math.max(...exact.map((x) => x.s.score), -Infinity);
  exact = exact
    .filter((x) => x.s.score >= best - 0.5)
    .sort((a, b) => {
      if (parsed.weakManhattan) {
        const am = a.p.borough === "Manhattan" ? 1 : 0;
        const bm = b.p.borough === "Manhattan" ? 1 : 0;
        if (am !== bm) return bm - am;
      }
      return b.s.score - a.s.score;
    });

  const target = numericHouse(parsed.houseNumber ?? "");
  const nearby = sameStreet
    .filter((x) => houseKey(x.p.houseNumber) !== parsed.houseKey)
    .filter((x) => x.s.score >= 10)
    .filter((x) => !parsed.borough || x.p.borough === parsed.borough)
    .filter((x) => !parsed.zip || x.p.zip === parsed.zip)
    .sort(
      (a, b) =>
        Math.abs(numericHouse(a.p.houseNumber) - target) -
        Math.abs(numericHouse(b.p.houseNumber) - target),
    );

  return {
    exact: dedupe(exact.map((x) => x.p)),
    nearby: dedupe(nearby.map((x) => x.p)),
    hintMismatch,
  };
}

/** Distinct boroughs among places — used to decide if we must ask. */
export function distinctBoroughs(places: Place[]): Array<Borough | undefined> {
  return Array.from(new Set(places.map((p) => p.borough)));
}

/**
 * Deep link to the NYC Board of Elections poll-site finder, which also
 * shows the voter's official sample ballot.
 */
export function pollSiteUrl(p: { houseNumber: string; street: string; zip?: string }): string {
  const url = new URL("https://findmypollsite.vote.nyc/");
  url.searchParams.set("hn", p.houseNumber);
  url.searchParams.set("sn", p.street);
  if (p.zip) url.searchParams.set("zip", p.zip);
  return url.toString();
}
