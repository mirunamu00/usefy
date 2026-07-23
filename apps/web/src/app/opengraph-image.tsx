import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { hookCount, componentCount } from "@/data/registry";

export const alt = "usefy — the React tools you keep rebuilding, already built";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const hookMark =
  "data:image/png;base64," +
  readFileSync(join(process.cwd(), "src/app/icon.png")).toString("base64");

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0e13",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hookMark} width={72} height={72} alt="" />
          <div style={{ fontSize: 40, fontWeight: 700, color: "#e7ecf3" }}>usefy</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 68, fontWeight: 800, color: "#e7ecf3", lineHeight: 1.05, letterSpacing: -1.5 }}>
            The React tools you
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>
            <span style={{ color: "#e7ecf3" }}>keep rebuilding.&nbsp;</span>
            <span style={{ color: "#a78bff" }}>Already built.</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, color: "#94a1af", fontSize: 28 }}>
          <span>{`${hookCount} hooks`}</span>
          <span style={{ color: "#2d3742" }}>·</span>
          <span>{`${componentCount} components`}</span>
          <span style={{ color: "#2d3742" }}>·</span>
          <span>TypeScript · SSR-safe</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
