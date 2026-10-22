/**
 * Google Analytics 4 is on only when NEXT_PUBLIC_GA_ID is set to a valid
 * measurement ID (G-XXXXXXX). Set it for Production in Vercel; leave it unset
 * for previews and local dev.
 */
const raw = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const GA_ID: string | undefined = /^G-[A-Z0-9]{4,20}$/.test(raw) ? raw : undefined;
