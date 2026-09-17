"use client";

import { useEffect, useState } from "react";

// A bare calendar date (YYYY-MM-DD) is a voting day — count down to when
// polls close, 9 PM Eastern, not midnight UTC. Otherwise the clock would hit
// zero the evening before Election Day. November is EST (UTC−5).
function toTarget(date: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T21:00:00-05:00`);
  }
  return new Date(date);
}

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: false,
  };
}

export function Countdown({
  date,
  compact = false,
}: {
  date: string;
  compact?: boolean;
}) {
  // Pages are pre-rendered at build time, so the server can't know "now".
  // Render placeholders until mounted to avoid a hydration mismatch.
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    const target = toTarget(date);
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (compact) {
    return (
      <span className="poster text-3xl text-ember tabular-nums">
        {t ? `${t.days}d ${t.hours}h ${t.minutes}m` : "--d --h --m"}
      </span>
    );
  }

  return (
    <div
      className="flex items-end gap-3"
      role="timer"
      aria-label={
        t ? `${t.days} days, ${t.hours} hours, ${t.minutes} minutes left` : undefined
      }
    >
      <Unit value={t?.days} label="DAYS" />
      <Unit value={t?.hours} label="HRS" />
      <Unit value={t?.minutes} label="MIN" />
      <Unit value={t?.seconds} label="SEC" />
    </div>
  );
}

function Unit({ value, label }: { value?: number; label: string }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <span className="poster text-5xl text-ink tabular-nums">
        {value == null ? "--" : String(value).padStart(2, "0")}
      </span>
      <span className="stamp text-muted">{label}</span>
    </div>
  );
}
