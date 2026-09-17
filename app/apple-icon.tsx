import { ImageResponse } from "next/og";

// Apple touch icons must be raster; Next 16 no longer links an SVG one, so
// the mark is generated as a PNG at build time instead.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ff3d1f",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 180 180">
          <path
            d="M40 96 L76 130 L140 50"
            fill="none"
            stroke="#f2ede3"
            strokeWidth="22"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    ),
    size,
  );
}
