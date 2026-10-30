"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { nextElectionBoundary } from "@/lib/election";

const Clock = createContext<number>(0);
export function ElectionClock({ initialNow, children }: { initialNow: number; children: React.ReactNode }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      clearTimeout(timer);
      timer = setTimeout(tick, Math.min(nextElectionBoundary(current) - current + 25, 2147483647));
    };
    tick();
    const visible = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", visible); };
  }, []);
  return <Clock.Provider value={now}>{children}</Clock.Provider>;
}
export const useElectionNow = () => useContext(Clock);
