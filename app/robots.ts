import type { MetadataRoute } from "next";

// Answer engines and AI assistants that fetch pages to cite them. They are
// allowed by "*" already; naming them makes the intent explicit, and each
// named group needs the same disallows because a bot obeys only its own group.
const ANSWER_ENGINES = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Applebot",
  "Applebot-Extended",
  "Google-Extended",
  "DuckAssistBot",
  "MistralAI-User",
];

const DISALLOW = ["/api/", "/embed"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ANSWER_ENGINES, allow: "/", disallow: DISALLOW },
      { userAgent: "*", allow: "/", disallow: DISALLOW },
    ],
    sitemap: "https://ballotnyc.org/sitemap.xml",
    host: "https://ballotnyc.org",
  };
}
