/**
 * Pure address parsing + matching helpers, shared by the browser
 * (autocomplete) and the /api/geocode route. No network access here.
 *
 * NYC addresses have a few quirks worth handling explicitly:
 *  - Queens house numbers are hyphenated ("37-17 30th St"). People type
 *    them as "37 17 30th St", "3717 30th St", or with an en dash.
 *  - Nobody types a city for NYC; many Brooklynites type "New York, NY".
 *  - The Census geocoder wants postal city names ("Astoria", not "Queens";
 *    "New York", not "Manhattan").
 */

export type Borough =
  | "Manhattan"
  | "Brooklyn"
  | "Queens"
  | "Bronx"
  | "Staten Island";

export const BOROUGHS: Borough[] = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

/** Postal "city" the Census geocoder accepts for each borough (Queens has none). */
export const CENSUS_CITY: Record<Borough, string | null> = {
  Manhattan: "New York",
  Brooklyn: "Brooklyn",
  Bronx: "Bronx",
  "Staten Island": "Staten Island",
  Queens: null,
};

// Place names people put after the street → which borough they imply.
// "new york" is deliberately NOT here: it's a weak hint (see parseAddress).
const LOCALITY_TO_BOROUGH: Record<string, Borough> = {
  manhattan: "Manhattan",
  "new york city": "Manhattan",
  harlem: "Manhattan",
  "east harlem": "Manhattan",
  "washington heights": "Manhattan",
  inwood: "Manhattan",
  "upper west side": "Manhattan",
  "upper east side": "Manhattan",
  chelsea: "Manhattan",
  "east village": "Manhattan",
  "west village": "Manhattan",
  "lower east side": "Manhattan",
  "roosevelt island": "Manhattan",
  brooklyn: "Brooklyn",
  bklyn: "Brooklyn",
  bk: "Brooklyn",
  gowanus: "Brooklyn",
  "park slope": "Brooklyn",
  "carroll gardens": "Brooklyn",
  "cobble hill": "Brooklyn",
  "boerum hill": "Brooklyn",
  "red hook": "Brooklyn",
  williamsburg: "Brooklyn",
  greenpoint: "Brooklyn",
  bushwick: "Brooklyn",
  "bed stuy": "Brooklyn",
  "bed-stuy": "Brooklyn",
  "bedford stuyvesant": "Brooklyn",
  "crown heights": "Brooklyn",
  "prospect heights": "Brooklyn",
  flatbush: "Brooklyn",
  "fort greene": "Brooklyn",
  "clinton hill": "Brooklyn",
  "bay ridge": "Brooklyn",
  bensonhurst: "Brooklyn",
  "sunset park": "Brooklyn",
  "sheepshead bay": "Brooklyn",
  "coney island": "Brooklyn",
  "brighton beach": "Brooklyn",
  dumbo: "Brooklyn",
  "brooklyn heights": "Brooklyn",
  "windsor terrace": "Brooklyn",
  "ditmas park": "Brooklyn",
  midwood: "Brooklyn",
  "east new york": "Brooklyn",
  brownsville: "Brooklyn",
  canarsie: "Brooklyn",
  bronx: "Bronx",
  "the bronx": "Bronx",
  "staten island": "Staten Island",
  si: "Staten Island",
  queens: "Queens",
  astoria: "Queens",
  "long island city": "Queens",
  lic: "Queens",
  sunnyside: "Queens",
  woodside: "Queens",
  "jackson heights": "Queens",
  "east elmhurst": "Queens",
  elmhurst: "Queens",
  corona: "Queens",
  flushing: "Queens",
  "college point": "Queens",
  whitestone: "Queens",
  bayside: "Queens",
  "little neck": "Queens",
  douglaston: "Queens",
  "oakland gardens": "Queens",
  "fresh meadows": "Queens",
  "forest hills": "Queens",
  "rego park": "Queens",
  "kew gardens": "Queens",
  "richmond hill": "Queens",
  "south richmond hill": "Queens",
  "ozone park": "Queens",
  "south ozone park": "Queens",
  "howard beach": "Queens",
  woodhaven: "Queens",
  ridgewood: "Queens",
  glendale: "Queens",
  maspeth: "Queens",
  "middle village": "Queens",
  jamaica: "Queens",
  "jamaica estates": "Queens",
  briarwood: "Queens",
  hollis: "Queens",
  "queens village": "Queens",
  "st albans": "Queens",
  "saint albans": "Queens",
  "springfield gardens": "Queens",
  rosedale: "Queens",
  laurelton: "Queens",
  "cambria heights": "Queens",
  bellerose: "Queens",
  "glen oaks": "Queens",
  "floral park": "Queens",
  "far rockaway": "Queens",
  arverne: "Queens",
  "rockaway park": "Queens",
  "rockaway beach": "Queens",
  "breezy point": "Queens",
  "belle harbor": "Queens",
};

const WEAK_MANHATTAN = new Set(["new york", "nyc", "ny ny", "new york ny"]);

const STREET_TYPES: Record<string, string> = {
  street: "st",
  st: "st",
  str: "st",
  avenue: "ave",
  ave: "ave",
  av: "ave",
  road: "rd",
  rd: "rd",
  boulevard: "blvd",
  blvd: "blvd",
  place: "pl",
  pl: "pl",
  drive: "dr",
  dr: "dr",
  lane: "ln",
  ln: "ln",
  terrace: "ter",
  ter: "ter",
  court: "ct",
  ct: "ct",
  parkway: "pkwy",
  pkwy: "pkwy",
  highway: "hwy",
  hwy: "hwy",
  expressway: "expy",
  expy: "expy",
  turnpike: "tpke",
  tpke: "tpke",
  square: "sq",
  sq: "sq",
  plaza: "plz",
  plz: "plz",
  way: "way",
  loop: "loop",
  walk: "walk",
  row: "row",
  crescent: "cres",
  cres: "cres",
  circle: "cir",
  cir: "cir",
  path: "path",
  alley: "aly",
  slip: "slip",
  oval: "oval",
  broadway: "broadway",
};

const DIRECTIONS: Record<string, string> = {
  east: "e",
  e: "e",
  west: "w",
  w: "w",
  north: "n",
  n: "n",
  south: "s",
  s: "s",
};

const NUMBER_WORDS: Record<string, string> = {
  first: "1",
  second: "2",
  third: "3",
  fourth: "4",
  fifth: "5",
  sixth: "6",
  seventh: "7",
  eighth: "8",
  ninth: "9",
  tenth: "10",
  eleventh: "11",
  twelfth: "12",
};

const OTHER_WORDS: Record<string, string> = {
  saint: "st",
  centre: "center",
  mount: "mt",
  fort: "ft",
};

const UNIT_RE =
  /\s*(?:,\s*)?(?:\b(?:apt|apartment|unit|suite|ste|fl|floor|rm|room|ph|penthouse|bsmt|basement)\b\.?\s*#?\s*[\w-]*|#\s*[\w-]+)\s*$/i;

/** Normalize dashes/spacing, drop apartment/unit, fix Queens hyphen numbers. */
export function normalizeAddressInput(raw: string): string {
  let s = raw
    .replace(/[‐-―−]/g, "-") // en/em dashes → hyphen
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // "37 - 17" → "37-17"
  s = s.replace(/^(\d+)\s*-\s*(\d+)\b/, "$1-$2");

  // Unit designators can sit before the city ("365 Bond St Apt 4B, Brooklyn")
  // or at the very end. Strip them from the street segment.
  const parts = s.split(",");
  parts[0] = stripUnit(parts[0]);
  s = parts
    .map((p) => p.trim())
    .filter((p, i) => i === 0 || p.length > 0)
    .filter((p) => !UNIT_ONLY_RE.test(p))
    .join(", ");

  // Queens style typed with a space: "37 17 30th St" → "37-17 30th St".
  // Only when the second number is exactly two digits and is NOT itself
  // the street ("350 55 St" stays as-is).
  const m = s.match(/^(\d{1,3}) (\d{2}) (\S+)/);
  if (m) {
    const next = m[3].toLowerCase().replace(/[.,]/g, "");
    if (!(next in STREET_TYPES) && !(next in DIRECTIONS)) {
      s = s.replace(/^(\d{1,3}) (\d{2}) /, "$1-$2 ");
    }
  }
  return s;
}

const UNIT_ONLY_RE =
  /^(?:(?:apt|apartment|unit|suite|ste|fl|floor|rm|room|ph)\b\.?\s*#?\s*[\w-]+|#\s*[\w-]+)$/i;

function stripUnit(segment: string): string {
  let out = segment;
  for (let i = 0; i < 2; i++) {
    const next = out.replace(UNIT_RE, "");
    if (next === out) break;
    out = next;
  }
  return out.trim();
}

export interface ParsedAddress {
  /** Cleaned single-line address (unit removed, hyphens fixed). */
  cleaned: string;
  /** House number as typed/normalized, e.g. "37-17" or "365". */
  houseNumber?: string;
  /** Comparison key for house numbers ("37-17" → "3717"). */
  houseKey?: string;
  /** Street as typed, without number/locality ("30th St"). */
  street?: string;
  /** 5-digit ZIP if the user typed one after the street. */
  zip?: string;
  /** Borough implied by an explicit borough/neighborhood name. */
  borough?: Borough;
  /** True when the only locality given was "New York"/"NYC". */
  weakManhattan: boolean;
  /** True when the user typed a locality/ZIP at all. */
  hasLocality: boolean;
  /** True when the input is just a ZIP code. */
  zipOnly: boolean;
}

export function houseKey(hn: string): string {
  return hn.toLowerCase().replace(/[\s-]/g, "").replace(/^0+/, "");
}

function localityHint(text: string): {
  borough?: Borough;
  weak: boolean;
} {
  const t = text
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(ny|n y|new york state|usa|us)\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return { weak: false };
  if (LOCALITY_TO_BOROUGH[t]) return { borough: LOCALITY_TO_BOROUGH[t], weak: false };
  if (WEAK_MANHATTAN.has(t)) return { weak: true };
  // Try the longest known locality that the text ends with.
  const keys = Object.keys(LOCALITY_TO_BOROUGH).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (t === k || t.endsWith(` ${k}`) || t.startsWith(`${k} `)) {
      return { borough: LOCALITY_TO_BOROUGH[k], weak: false };
    }
  }
  return { weak: false };
}

/**
 * Remove a trailing ", Brooklyn NY 11231"-style tail from a comma-less
 * address. Returns the street part plus whatever tail was removed.
 */
function splitTrailingLocality(s: string): { street: string; tail: string } {
  let street = s;
  let tail = "";
  const zip = street.match(/\s(\d{5})(?:-\d{4})?$/);
  if (zip) {
    tail = zip[1];
    street = street.slice(0, zip.index).trim();
  }
  const state = street.match(/\s(ny|n\.y\.)$/i);
  if (state) {
    tail = `${state[1]} ${tail}`.trim();
    street = street.slice(0, state.index).trim();
  }
  const lower = street.toLowerCase();
  const keys = [
    ...Object.keys(LOCALITY_TO_BOROUGH),
    "new york city",
    "new york",
    "nyc",
  ].sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (!lower.endsWith(` ${k}`)) continue;
    const before = street.slice(0, street.length - k.length).trim();
    const lastWord = before.split(" ").pop()?.toLowerCase().replace(/\./g, "");
    // Only strip if what's left still ends like a street ("... St").
    // Protects "123 New York Ave" and "10 Jamaica Ave".
    if (!lastWord) continue;
    const endsLikeStreet =
      lastWord in STREET_TYPES ||
      /^\d+(st|nd|rd|th)?$/.test(lastWord) ||
      lastWord in DIRECTIONS;
    if (!endsLikeStreet) continue;
    tail = `${street.slice(before.length).trim()} ${tail}`.trim();
    street = before;
    break;
  }
  return { street, tail };
}

export function parseAddress(raw: string): ParsedAddress {
  const cleaned = normalizeAddressInput(raw);
  const base: ParsedAddress = {
    cleaned,
    weakManhattan: false,
    hasLocality: false,
    zipOnly: /^\d{5}(-\d{4})?$/.test(cleaned),
  };
  if (!cleaned || base.zipOnly) return base;

  const [first, ...restParts] = cleaned.split(",").map((p) => p.trim());
  let streetSeg = first;
  let tail = restParts.join(" ");
  if (restParts.length === 0) {
    const split = splitTrailingLocality(first);
    streetSeg = split.street;
    tail = split.tail;
  }

  const zipMatch = tail.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) base.zip = zipMatch[1];
  const tailNoZip = tail.replace(/\b\d{5}(?:-\d{4})?\b/, "").trim();
  if (tail.trim()) base.hasLocality = true;
  const hint = localityHint(tailNoZip);
  base.borough = hint.borough;
  base.weakManhattan = hint.weak;

  const hn = streetSeg.match(/^(\d+[a-z]?(?:-\d+[a-z]?)?)(?:\s+1\/2)?\s+(.+)$/i);
  if (hn) {
    base.houseNumber = hn[1].toUpperCase();
    base.houseKey = houseKey(hn[1]);
    base.street = hn[2].trim();
  } else {
    base.street = streetSeg;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Street comparison
// ---------------------------------------------------------------------------

interface StreetTokens {
  name: string[];
  type?: string;
  /** The street-type word as written ("street", "avenue"). */
  rawType?: string;
  dir: string[];
}

function baseTokens(street: string): string[] {
  return street
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9/ -]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((t) => {
      const ord = t.match(/^(\d+)(st|nd|rd|th)$/);
      if (ord) return ord[1];
      if (NUMBER_WORDS[t]) return NUMBER_WORDS[t];
      if (OTHER_WORDS[t]) return OTHER_WORDS[t];
      return t;
    });
}

export function streetTokens(street: string): StreetTokens {
  const toks = baseTokens(street);
  const out: StreetTokens = { name: [], dir: [] };
  // Trailing directional ("Kingsbridge Rd E")
  if (toks.length > 2 && DIRECTIONS[toks[toks.length - 1]]) {
    out.dir.push(DIRECTIONS[toks.pop()!]);
  }
  // Leading directional ("E 7th St", "West End", "South St")
  if (toks.length >= 2 && DIRECTIONS[toks[0]]) {
    out.dir.push(DIRECTIONS[toks.shift()!]);
  }
  // Trailing street type, unless it's the only token ("Broadway")
  if (toks.length > 1 && STREET_TYPES[toks[toks.length - 1]]) {
    out.rawType = toks.pop()!;
    out.type = STREET_TYPES[out.rawType];
  }
  out.name = toks.map((t) => DIRECTIONS[t] ?? STREET_TYPES[t] ?? t);
  return out;
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  // One swapped pair of neighboring letters ("bnod" → "bond").
  if (a.length === b.length) {
    const diff: number[] = [];
    for (let k = 0; k < a.length && diff.length <= 2; k++) {
      if (a[k] !== b[k]) diff.push(k);
    }
    if (
      diff.length === 2 &&
      diff[1] === diff[0] + 1 &&
      a[diff[0]] === b[diff[1]] &&
      a[diff[1]] === b[diff[0]]
    ) {
      return true;
    }
  }
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenMatches(typed: string, cand: string): boolean {
  if (typed === cand) return true;
  if (/^\d+$/.test(typed) || /^\d+$/.test(cand)) return false;
  if (typed.length >= 2 && cand.startsWith(typed)) return true;
  if (typed.length >= 4 && editDistanceAtMostOne(typed, cand)) return true;
  return false;
}

export interface StreetMatch {
  /** Every typed name token matched a candidate token. */
  nameMatch: boolean;
  /** Higher is better. */
  score: number;
}

export function compareStreets(typed: string, candidate: string): StreetMatch {
  const a = streetTokens(typed);
  const b = streetTokens(candidate);
  if (a.name.length === 0) return { nameMatch: false, score: 0 };
  const used = new Set<number>();
  let matched = 0;
  let exactTokens = 0;
  let partialType = false;
  a.name.forEach((t, i) => {
    let k = b.name.findIndex((c, idx) => !used.has(idx) && c === t);
    if (k >= 0) exactTokens++;
    else k = b.name.findIndex((c, idx) => !used.has(idx) && tokenMatches(t, c));
    if (k >= 0) {
      used.add(k);
      matched++;
      return;
    }
    // Still typing the street type ("365 Bond S", "37-17 30th Av").
    const isLast = i === a.name.length - 1 && i > 0;
    if (
      isLast &&
      !a.type &&
      b.rawType &&
      (b.rawType.startsWith(t) || (b.type ?? "").startsWith(t))
    ) {
      matched++;
      partialType = true;
    }
  });
  const nameMatch = matched === a.name.length;
  if (partialType) {
    // Treat as a type match against the candidate, minus the partial token.
    const nameLen = a.name.length - 1;
    let score = (nameLen > 0 ? 10 : 0) + (nameLen === b.name.length ? 1 : 0) + 1;
    if (exactTokens === nameLen) score += 1;
    if (a.dir.length) score += b.dir.length && a.dir[0] === b.dir[0] ? 1 : -5;
    return { nameMatch: nameLen > 0, score };
  }
  let score = (matched / a.name.length) * 10;
  // Exact name length match beats prefix matches ("Bay" vs "Bayridge").
  if (nameMatch && a.name.length === b.name.length) score += 1;
  // Whole-token matches beat prefix/typo matches ("Bay" → BAY over BAYARD).
  if (nameMatch && exactTokens === a.name.length) score += 1;
  // A conflicting type or direction is a different street — push it below 10.
  if (a.type && b.type) score += a.type === b.type ? 2 : -5;
  // "W 4th St" is not "4th St" (Brooklyn): a typed direction must be present.
  if (a.dir.length) score += b.dir.length && a.dir[0] === b.dir[0] ? 1 : -5;
  return { nameMatch, score };
}

/** Stable key for "same street" regardless of spelling variants. */
export function streetKey(street: string): string {
  const t = streetTokens(street);
  return [...t.dir, ...t.name, t.type ?? ""].filter(Boolean).sort().join(" ");
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

const ORDINAL_FOLLOWERS = new Set([
  "street",
  "avenue",
  "road",
  "place",
  "drive",
  "terrace",
  "lane",
  "court",
  "walk",
  "st",
  "ave",
  "rd",
  "pl",
]);

/** "EAST 7 STREET" → "East 7th Street"; "ST MARK'S PLACE" → "St Mark's Place". */
export function prettyStreet(street: string): string {
  const words = street.trim().split(/\s+/);
  return words
    .map((w, i) => {
      const next = words[i + 1]?.toLowerCase();
      if (/^\d+$/.test(w) && next && ORDINAL_FOLLOWERS.has(next)) {
        return ordinal(Number(w));
      }
      if (/^\d/.test(w)) return w.toLowerCase();
      return w
        .toLowerCase()
        .replace(/(^|[\s'-])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase())
        .replace(/'S\b/g, "'s");
    })
    .join(" ");
}
