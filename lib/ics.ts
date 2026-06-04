import type { KeyDate } from "./types";

function formatICSDate(iso: string): string {
  // All-day events use YYYYMMDD.
  return iso.replace(/-/g, "");
}

function nextDay(iso: string): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function escapeICS(s: string): string {
  return s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

export function buildICS(dates: KeyDate[]): string {
  const stamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const events = dates
    .map((d) =>
      [
        "BEGIN:VEVENT",
        `UID:${d.id}@ballot-nyc`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${formatICSDate(d.date)}`,
        `DTEND;VALUE=DATE:${nextDay(d.date)}`,
        `SUMMARY:${escapeICS(`Ballot NYC — ${d.label}`)}`,
        d.note ? `DESCRIPTION:${escapeICS(d.note)}` : "",
        d.actionUrl ? `URL:${d.actionUrl}` : "",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n"),
    )
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ballot NYC//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(dates: KeyDate[], filename = "ballot-nyc.ics") {
  const ics = buildICS(dates);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
