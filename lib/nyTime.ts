/**
 * Election deadlines are New York calendar dates, not UTC dates, and New York
 * is on daylight time through early November. Adding a fixed offset to UTC
 * midnight gets the day wrong on both sides of midnight, so every deadline
 * comparison goes through these helpers.
 */

const NY = "America/New_York";

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: NY,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function partsAt(ms: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of PARTS.formatToParts(new Date(ms))) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  // Intl renders midnight as hour 24 in some engines.
  if (out.hour === 24) out.hour = 0;
  return out;
}

/** Offset of New York from UTC at this instant, in ms (negative). */
function offsetAt(ms: number): number {
  const p = partsAt(ms);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
}

/** The instant of a New York wall-clock time (DST-correct). */
export function nyTime(
  dateISO: string,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, hour, minute, second);
  let guess = naive;
  // Two passes settle the offset, including across a DST change.
  for (let i = 0; i < 2; i++) guess = naive - offsetAt(guess);
  return guess;
}

/** Today in New York as YYYY-MM-DD. */
export function nyToday(now: number = Date.now()): string {
  const p = partsAt(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Whole New York calendar days from today until a date (0 = today, <0 = past). */
export function daysUntil(dateISO: string, now: number = Date.now()): number {
  const today = nyToday(now);
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${dateISO}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** True while it is still that date in New York (deadlines run to 11:59 PM). */
export function isOnOrBefore(dateISO: string, now: number = Date.now()): boolean {
  return daysUntil(dateISO, now) >= 0;
}

/** Polls close at 9 PM Eastern on a voting day. */
export function pollsClose(dateISO: string): number {
  return nyTime(dateISO, 21, 0, 0);
}
