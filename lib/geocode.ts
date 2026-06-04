import type { SelectedDistricts } from "./types";

export interface GeocodeResult {
  matchedAddress: string;
  districts: SelectedDistricts;
  outsideNY: boolean;
  warnings: string[];
}

/**
 * Browser-side geocode. Calls our own /api/geocode route, which proxies
 * the U.S. Census Geocoder server-side because Census doesn't send
 * CORS headers.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const url = `/api/geocode?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  return (await res.json()) as GeocodeResult;
}
