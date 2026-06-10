import type { District } from "./types";

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** Ballotpedia page for a district's race — real candidate lists we don't have to maintain. */
export function ballotpediaUrl(district: District): string | null {
  const num = Number.parseInt(district.id.split("-")[1] ?? "", 10);
  if (Number.isNaN(num)) return null;
  switch (district.type) {
    case "us_house":
      return `https://ballotpedia.org/New_York%27s_${ordinal(num)}_Congressional_District_election,_2026`;
    case "state_senate":
      return `https://ballotpedia.org/New_York_State_Senate_District_${num}`;
    case "state_assembly":
      return `https://ballotpedia.org/New_York_State_Assembly_District_${num}`;
    default:
      return null;
  }
}
