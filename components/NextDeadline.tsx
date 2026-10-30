"use client";

import { useElectionNow } from "./ElectionClock";
import { deadline, ELECTION, electionState, shortDate } from "@/lib/election";

export function NextDeadline() {
  const state = electionState(useElectionNow());
  const text = state.archived ? "2026 election ended — official updates"
    : state.early ? `Early voting through ${shortDate(ELECTION.earlyEnd)} — check hours and your assigned site`
    : state.electionDay ? "Election Day — polls open 6 AM–9 PM"
    : state.registrationPassed ? `Election Day ${shortDate(ELECTION.day)} — check your registration and poll site`
    : `New registrations due ${shortDate(ELECTION.registration)} — check your record or register`;
  const href = state.archived ? ELECTION.hoursSource : state.early || state.electionDay ? ELECTION.pollSite
    : state.registrationPassed ? ELECTION.registrationLookup : deadline("register").actionUrl;
  return <a href={href} target="_blank" rel="noreferrer" className="mt-4 block border-l-4 border-ember pl-4 text-sm font-semibold underline">{text} →</a>;
}
