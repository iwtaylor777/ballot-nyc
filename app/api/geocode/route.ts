import { NextResponse } from "next/server";
import type { SelectedDistricts } from "@/lib/types";

export const runtime = "edge";

const CENSUS =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

interface CensusGeography {
  BASENAME?: string;
  NAME?: string;
}

interface CensusMatch {
  matchedAddress?: string;
  addressComponents?: { state?: string };
  geographies?: Record<string, CensusGeography[]>;
}

function pickByKeyword(
  geographies: Record<string, CensusGeography[]>,
  keywords: string[],
): CensusGeography | undefined {
  for (const key of Object.keys(geographies)) {
    const lower = key.toLowerCase();
    if (keywords.every((k) => lower.includes(k))) {
      const list = geographies[key];
      if (Array.isArray(list) && list.length > 0) return list[0];
    }
  }
  return undefined;
}

function num(g: CensusGeography | undefined): string | undefined {
  const raw = g?.BASENAME;
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return String(n);
}

export interface GeocodeApiResult {
  matchedAddress: string;
  districts: SelectedDistricts;
  outsideNY: boolean;
  warnings: string[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address || address.trim().length < 5) {
    return NextResponse.json(
      { error: "address required" },
      { status: 400 },
    );
  }

  const url = new URL(CENSUS);
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");

  let data: { result?: { addressMatches?: CensusMatch[] } };
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `census ${res.status}` },
        { status: 502 },
      );
    }
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "census fetch failed" }, { status: 502 });
  }

  const match = data.result?.addressMatches?.[0];
  if (!match) {
    return NextResponse.json({ error: "no match" }, { status: 404 });
  }

  const state = match.addressComponents?.state?.toUpperCase();
  const outsideNY = state !== undefined && state !== "NY";
  const warnings: string[] = [];
  if (outsideNY) {
    warnings.push(
      `Address resolves to ${state} — Ballot NYC only covers New York.`,
    );
  }

  const geographies = match.geographies ?? {};
  const cd = pickByKeyword(geographies, ["congressional"]);
  const upper = pickByKeyword(geographies, ["state", "upper"]);
  const lower = pickByKeyword(geographies, ["state", "lower"]);

  const districts: SelectedDistricts = {};
  const cdNum = num(cd);
  const ssNum = num(upper);
  const adNum = num(lower);
  if (cdNum) districts.us_house = `ush-${cdNum}`;
  if (ssNum) districts.state_senate = `ss-${ssNum}`;
  if (adNum) districts.state_assembly = `ad-${adNum}`;

  if (!cdNum) warnings.push("Could not resolve U.S. House district.");
  if (!ssNum) warnings.push("Could not resolve State Senate district.");
  if (!adNum) warnings.push("Could not resolve State Assembly district.");

  const result: GeocodeApiResult = {
    matchedAddress: match.matchedAddress ?? address,
    districts,
    outsideNY,
    warnings,
  };
  return NextResponse.json(result);
}
