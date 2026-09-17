import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/embed"] },
    sitemap: "https://ballotnyc.org/sitemap.xml",
  };
}
