import { movedVoterGuidance } from "./election";

/** First-time voter FAQs shown on /plan (and published as FAQPage data). */
const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Do I need ID to vote?",
    a: "Most New Yorkers don't. Only first-time voters who registered by mail without verification need to show something — a photo ID, current utility bill, or bank statement works.",
  },
  {
    q: "I'm still in line at 9 PM.",
    a: "Stay in line. If you're in line when polls close, you have the legal right to vote. Don't let anyone wave you off.",
  },
  {
    q: "Is early voting at the same place?",
    a: "Not always — your early voting site can be different from your Election Day site. Check findmypollsite.vote.nyc for both.",
  },
  {
    q: "Can anyone see who I voted for?",
    a: "No. Whether you voted is public record — who you voted for never is.",
  },
  {
    q: "Why is the same name on two lines?",
    a: "New York has fusion voting — a candidate can appear on more than one party's line (say, Democratic and Working Families). It's the same person, and your vote counts once no matter which line you pick.",
  },
];

export function getVoterFaq(now: number) {
  return [...FAQ.slice(0, 3), { q: "I moved recently.", a: movedVoterGuidance(now) }, ...FAQ.slice(3)];
}
