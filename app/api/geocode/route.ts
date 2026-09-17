import { NextResponse } from "next/server";
import { BOROUGHS, type Borough } from "@/lib/geo/address";
import {
  resolveAddress,
  resolvePlace,
  type FetchJson,
  type ResolveResult,
} from "@/lib/geo/resolve";

export const runtime = "edge";

const TIMEOUT_MS = 9000;

const fetchJson: FetchJson = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, cache: "no-store", signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};

const NO_STORE = { "Cache-Control": "no-store" };

function respond(result: ResolveResult) {
  return NextResponse.json(result, { headers: NO_STORE });
}

interface PlaceInput {
  lat?: unknown;
  lon?: unknown;
  label?: unknown;
  houseNumber?: unknown;
  street?: unknown;
  borough?: unknown;
  zip?: unknown;
}

function str(v: unknown, max = 120): string | undefined {
  return typeof v === "string" && v.length <= max ? v : undefined;
}

async function handle(address: string | undefined, place: PlaceInput | undefined) {
  try {
    if (place && typeof place === "object") {
      const lat = Number(place.lat);
      const lon = Number(place.lon);
      const borough = BOROUGHS.find((b) => b === place.borough) as Borough | undefined;
      return respond(
        await resolvePlace(
          {
            lat,
            lon,
            label: str(place.label, 200),
            houseNumber: str(place.houseNumber, 16),
            street: str(place.street),
            borough,
            zip: str(place.zip, 10),
          },
          fetchJson,
        ),
      );
    }
    if (!address || address.trim().length < 3 || address.length > 300) {
      return NextResponse.json(
        { status: "error", message: "Type your street address." },
        { status: 400, headers: NO_STORE },
      );
    }
    return respond(
      await resolveAddress(address, { fetchJson, fetchImpl: fetchWithTimeout }),
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message:
          "The address lookup service didn't respond. Try again in a moment, or pick your districts manually.",
      },
      { status: 502, headers: NO_STORE },
    );
  }
}

/**
 * POST { address } or { place: { lat, lon, ... } }. The browser uses POST so
 * home addresses never end up in URLs or request logs.
 */
export async function POST(req: Request) {
  let body: { address?: unknown; place?: PlaceInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Bad request." },
      { status: 400, headers: NO_STORE },
    );
  }
  return handle(typeof body.address === "string" ? body.address : undefined, body.place);
}

/** GET ?address=… kept for quick manual testing. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  if (lat && lon) return handle(undefined, { lat, lon });
  return handle(searchParams.get("address") ?? undefined, undefined);
}
