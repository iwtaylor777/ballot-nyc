import type { MetadataRoute } from "next";
import { CERTIFICATION, certifiedRaceKeys } from "@/lib/data";
import { CONTENT_UPDATED, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1 },
    { path: "/onboarding", priority: 0.9 },
    { path: "/proposals", priority: 0.9 },
    { path: "/dates", priority: 0.9 },
    { path: "/plan", priority: 0.8 },
    { path: "/quiz", priority: 0.6 },
    { path: "/partners", priority: 0.4 },
  ];
  const updated = new Date(CONTENT_UPDATED);
  const certified = new Date(CERTIFICATION.date);
  return [
    ...pages.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: updated,
      changeFrequency: "daily" as const,
      priority: p.priority,
    })),
    ...certifiedRaceKeys().map((r) => ({
      url: `${SITE_URL}/race/${r.officeId}/${r.districtId}`,
      lastModified: certified > updated ? certified : updated,
      changeFrequency: "weekly" as const,
      priority: r.districtId === "statewide-ny" ? 0.8 : 0.7,
    })),
    { url: `${SITE_URL}/llms.txt`, lastModified: updated, changeFrequency: "daily" as const, priority: 0.3 },
  ];
}
