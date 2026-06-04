/**
 * Address autocomplete via Photon (https://photon.komoot.io).
 * Free, CORS-enabled, attribution-required ("powered by Photon / OSM").
 * We bias toward NYC and filter to results inside NY state.
 */

const PHOTON = "https://photon.komoot.io/api/";

// Center of Manhattan, used to bias suggestions toward NYC.
const BIAS_LAT = 40.7549;
const BIAS_LON = -73.984;

// Rough NY state bounding box (lon_min, lat_min, lon_max, lat_max).
const NY_BBOX = [-79.8, 40.4, -71.8, 45.1] as const;

export interface AddressSuggestion {
  /** Display label rendered in the dropdown. */
  label: string;
  /** Single-line address fed into the Census Geocoder. */
  oneLine: string;
}

interface PhotonFeature {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
}

function formatSuggestion(f: PhotonFeature): AddressSuggestion | null {
  const p = f.properties;
  if (p.countrycode && p.countrycode.toUpperCase() !== "US") return null;
  if (p.state && p.state !== "NY" && p.state !== "New York") return null;

  const streetPart = [p.housenumber, p.street].filter(Boolean).join(" ");
  const head = streetPart || p.name;
  if (!head) return null;

  const cityPart = p.city || p.district;
  const tail = [cityPart, "NY", p.postcode].filter(Boolean).join(" ");
  const oneLine = [head, tail].filter(Boolean).join(", ");

  const labelTail = [cityPart, p.postcode].filter(Boolean).join(" · ");
  const label = labelTail ? `${head} — ${labelTail}` : head;

  return { label, oneLine };
}

export async function fetchSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<AddressSuggestion[]> {
  const url = new URL(PHOTON);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lat", String(BIAS_LAT));
  url.searchParams.set("lon", String(BIAS_LON));
  url.searchParams.set("bbox", NY_BBOX.join(","));

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`photon ${res.status}`);
  const data = (await res.json()) as { features?: PhotonFeature[] };

  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];
  for (const f of data.features ?? []) {
    const s = formatSuggestion(f);
    if (!s) continue;
    if (seen.has(s.oneLine)) continue;
    seen.add(s.oneLine);
    out.push(s);
    if (out.length >= 5) break;
  }
  return out;
}
