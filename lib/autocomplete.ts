/**
 * Address autocomplete backed by NYC Planning's GeoSearch (the city's own
 * address directory). Suggestions only ever show the house number the user
 * typed; if NYC has no such building we say so instead of quietly offering
 * a neighbor's address.
 */

import { normalizeAddressInput, parseAddress } from "./geo/address";
import { geosearch, geosearchQuery, rankPlaces, type Place } from "./geo/places";

export interface SuggestionResult {
  /** Exact house-number matches, safe to pick. */
  exact: Place[];
  /** Same street, other numbers — shown only when there's no exact match. */
  nearby: Place[];
  /** Why there are no suggestions, if we can tell. */
  hint?: "needs_number" | "zip_only";
}

export async function fetchSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<SuggestionResult> {
  const parsed = parseAddress(query);
  if (parsed.zipOnly) return { exact: [], nearby: [], hint: "zip_only" };
  if (!parsed.houseNumber) {
    // Letters but no leading number: nudge rather than guess.
    return /[a-z]/i.test(normalizeAddressInput(query))
      ? { exact: [], nearby: [], hint: "needs_number" }
      : { exact: [], nearby: [] };
  }
  const places = await geosearch("autocomplete", geosearchQuery(parsed), { signal });
  const ranked = rankPlaces(parsed, places);
  return {
    exact: ranked.exact.slice(0, 5),
    nearby: ranked.exact.length ? [] : ranked.nearby.slice(0, 2),
  };
}
