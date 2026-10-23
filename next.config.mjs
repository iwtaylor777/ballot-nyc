/** @type {import('next').NextConfig} */

// Ballot NYC's GA4 property. Measurement IDs are public (they ship in every
// page's HTML). Tracking is on for Vercel production builds only, so previews
// and local dev don't pollute the numbers; NEXT_PUBLIC_GA_ID overrides it.
const GA_PRODUCTION_ID = "G-Z955JYRVZ9";

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GA_ID:
      process.env.NEXT_PUBLIC_GA_ID ||
      (process.env.VERCEL_ENV === "production" ? GA_PRODUCTION_ID : ""),
  },
};

export default nextConfig;
