import { ImageResponse } from "next/og";

export const alt = "NYC State Supreme Court candidates — choose your borough — November 3, 2026 — Ballot NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 60, background: "#f2ede3", color: "#0a0a0a", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 700 }}><span>BALLOT · NYC</span><span>NOV 3 · 2026</span></div>
    <div style={{ display: "flex", flexDirection: "column", fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>
      <span style={{ fontSize: 40 }}>STATE SUPREME COURT</span>
      <span style={{ fontSize: 100, color: "#ff3d1f", marginTop: 12 }}>WHO ARE THE</span>
      <span style={{ fontSize: 100, color: "#ff3d1f" }}>CANDIDATES?</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontSize: 28 }}>Bronx · Brooklyn · Manhattan · Queens · Staten Island</span>
      <span style={{ fontSize: 25 }}>Independent, nonpartisan guide · ballotnyc.org/judges</span>
    </div>
  </div>, size);
}
