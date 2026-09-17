import type { MetadataRoute } from "next";
import { certifiedRaceKeys } from "@/lib/data";

const BASE = "https://ballotnyc.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/onboarding", "/proposals", "/dates", "/plan", "/partners"];
  return [
    ...pages.map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly" as const })),
    ...certifiedRaceKeys().map((r) => ({
      url: `${BASE}/race/${r.officeId}/${r.districtId}`,
      changeFrequency: "weekly" as const,
    })),
  ];
}
