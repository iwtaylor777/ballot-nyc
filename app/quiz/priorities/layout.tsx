import type { Metadata } from "next";

// Personal quiz step, stored on the device: keep it out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
