import type { Place } from "./geo/places";
import type { ResolveResult } from "./geo/resolve";

export type { ResolveResult } from "./geo/resolve";

export type GeocodeResponse =
  | ResolveResult
  | { status: "error"; message: string };

/**
 * Browser-side lookup. Calls our /api/geocode route (POST, so the address
 * stays out of URLs and logs), which talks to NYC GeoSearch and the U.S.
 * Census geocoder server-side.
 */
export async function lookupAddress(
  input: { address: string } | { place: Place },
): Promise<GeocodeResponse> {
  const res = await fetch("/api/geocode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  try {
    return (await res.json()) as GeocodeResponse;
  } catch {
    return {
      status: "error",
      message: "The lookup failed. Try again, or pick your districts manually.",
    };
  }
}
