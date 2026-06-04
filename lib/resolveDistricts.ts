import type { SelectedDistricts } from "./types";

/**
 * Single seam for district resolution. v1 takes manually selected districts
 * and returns them as-is. A future geocoding integration would accept an
 * address and return the same shape — UI code must not change.
 */
export function resolveDistricts(input: SelectedDistricts): SelectedDistricts {
  return input;
}
