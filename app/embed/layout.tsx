import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ballot NYC — lookup",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Let the host page show through around the card. */}
      <style>{"html,body{background:transparent!important;min-height:0!important}"}</style>
      <div className="p-1">{children}</div>
    </>
  );
}
