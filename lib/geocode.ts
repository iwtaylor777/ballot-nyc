import type { Place } from "./geo/places";
import type { ResolveResult } from "./geo/resolve";

export type { ResolveResult } from "./geo/resolve";

export type GeocodeResponse =
  | ResolveResult
  | { status: "error"; message: string; kind?: "service" | "input" };

/**
 * Browser-side lookup. Calls our /api/geocode route (POST, so the address
 * stays out of page URLs and ordinary URL logs), which talks to NYC GeoSearch and the U.S.
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
    const body = (await res.json()) as GeocodeResponse;
    if (!res.ok) return { status: "error", kind: res.status >= 500 ? "service" : "input", message: "message" in body ? body.message : "The lookup could not be completed. Please try again." };
    return body;
  } catch {
    return {
      status: "error",
      kind: "service",
      message: "The lookup failed. Try again, or pick your districts manually.",
    };
  }
}
