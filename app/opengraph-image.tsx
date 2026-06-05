import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ballot NYC — what's on your 2026 NYC ballot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#f2ede3",
          padding: 80,
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#ff3d1f",
              fontWeight: 800,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            NYC · Nov 3, 2026
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 140,
              lineHeight: 1,
              color: "#0a0a0a",
              fontWeight: 900,
              letterSpacing: -2,
              marginTop: 36,
              textTransform: "uppercase",
            }}
          >
            <span>What&apos;s</span>
            <span>on your</span>
            <span>ballot.</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 34,
              color: "#0a0a0a",
              fontWeight: 600,
            }}
          >
            Drop your address. See your races.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              backgroundColor: "#ff3d1f",
            }}
          >
            <svg width="60" height="60" viewBox="0 0 32 32">
              <path
                d="M7 17 L13 23 L25 9"
                fill="none"
                stroke="#f2ede3"
                strokeWidth="5"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
