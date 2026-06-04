import { ImageResponse } from "next/og";

export const alt =
  "998 web designs — handcrafted websites for small businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          <span style={{ color: "#2563eb" }}>998</span>
          <span style={{ color: "#0f172a", marginLeft: 12 }}>web designs</span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: "#475569",
            lineHeight: 1.35,
            maxWidth: 900,
          }}
        >
          Handcrafted websites for small businesses. $1,998 once. Delivered in 7
          business days.
        </div>
      </div>
    ),
    { ...size }
  );
}
