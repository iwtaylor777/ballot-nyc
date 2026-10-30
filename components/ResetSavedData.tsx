"use client";
import { useState } from "react";
import { clearSavedData } from "@/lib/storage";
export function ResetSavedData() {
  const [cleared, setCleared] = useState(false);
  return <div><button type="button" className="border-2 border-ink px-4 py-3 font-semibold" onClick={() => { clearSavedData(); setCleared(true); }}>Clear my saved ballot, answers, and plan</button><p role="status" className="mt-2 text-sm">{cleared ? "Saved guide information cleared from this browser. This does not delete analytics cookies or email you sent." : ""}</p></div>;
}
