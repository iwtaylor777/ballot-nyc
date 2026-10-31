import type { MetadataRoute } from "next";
import { CERTIFICATION, certifiedRaceKeys } from "@/lib/data";
import { CONTENT_UPDATED, SITE_URL } from "@/lib/seo";
import { EDITORIAL } from "@/lib/editorial";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1 },
    { path: "/onboarding", priority: 0.9 },
    { path: "/races", priority: 0.9 },
    { path: "/judges", priority: 0.9 },
    { path: "/about", priority: 0.5 },
    { path: "/privacy", priority: 0.4 },
    { path: "/proposals", priority: 0.9 },
    { path: "/dates", priority: 0.9 },
    { path: "/plan", priority: 0.8 },
    { path: "/quiz", priority: 0.6 },
    { path: "/partners", priority: 0.4 },
  ];
  const updated = new Date(CONTENT_UPDATED);
  const certified = new Date(CERTIFICATION.date);
  const discoveryUpdated = new Date(EDITORIAL.discoveryUpdated);
  return [
    ...pages.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: ["", "/races", "/judges", "/partners"].includes(p.path) ? discoveryUpdated : updated,
      changeFrequency: "daily" as const,
      priority: p.priority,
    })),
    ...certifiedRaceKeys().map((r) => ({
      url: `${SITE_URL}/race/${r.officeId}/${r.districtId}`,
      lastModified: certified > discoveryUpdated ? certified : discoveryUpdated,
      changeFrequency: "weekly" as const,
      priority: r.districtId === "statewide-ny" ? 0.8 : 0.7,
    })),
    { url: `${SITE_URL}/llms.txt`, lastModified: discoveryUpdated, changeFrequency: "daily" as const, priority: 0.3 },
  ];
}
