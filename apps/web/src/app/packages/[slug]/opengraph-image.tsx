import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getPackage, packages, categoryMeta } from "@/data/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "usefy package";

const hookMark =
  "data:image/png;base64," +
  readFileSync(join(process.cwd(), "src/app/icon.png")).toString("base64");

export function generateStaticParams() {
  return packages.map((p) => ({ slug: p.slug }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = getPackage(slug);
  const name = pkg?.name ?? "@usefy";
  const displayName = pkg?.displayName ?? "usefy";
  const tagline = pkg?.tagline ?? "Production-ready React hooks & components";
  const cat = pkg ? categoryMeta(pkg.category).title : "";

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
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hookMark} width={54} height={54} alt="" />
            <div style={{ fontSize: 30, fontWeight: 700, color: "#e7ecf3", fontFamily: "sans-serif" }}>usefy</div>
          </div>
          {cat ? (
            <div
              style={{
                fontSize: 22,
                color: "#94a1af",
                border: "1px solid #2d3742",
                borderRadius: 999,
                padding: "8px 20px",
                fontFamily: "sans-serif",
              }}
            >
              {cat}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 78, fontWeight: 700, color: "#e7ecf3", letterSpacing: -1 }}>
            {displayName}
          </div>
          <div style={{ fontSize: 30, color: "#94a1af", fontFamily: "sans-serif", maxWidth: 980, lineHeight: 1.35 }}>
            {tagline}
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#a78bff" }}>{`npm install ${name}`}</div>
      </div>
    ),
    { ...size },
  );
}
