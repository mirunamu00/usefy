/**
 * Generate a Y4M video of a QR code, for Chromium's fake capture device.
 *
 * This is what makes the **live camera path** automatically provable rather
 * than eyeballed. Y4M is a header plus raw YUV420 frames, so no encoder is
 * involved — a few dozen lines here replace a video-production step:
 *
 * ```bash
 * node scripts/make-capture-video.mjs                    # writes qr-capture.y4m
 * # then launch Chromium (Playwright `args`) with:
 * #   --use-fake-device-for-media-stream
 * #   --use-fake-ui-for-media-stream
 * #   --use-file-for-fake-video-capture=<abs path>/qr-capture.y4m
 * ```
 *
 * Driving the Storybook `LiveCamera` story under those flags exercises
 * `getUserMedia`, the frame pump, the decoder and the overlay geometry against
 * a moving picture — and the assertion is exact, because this file knows the
 * payload it drew.
 *
 * @param {string} [outPath] - Where to write. Defaults to ./qr-capture.y4m.
 */
import { writeFileSync } from "node:fs";
import { encodeQR } from "@usefy/qr-code/headless";

const OUT = process.argv[2] ?? "qr-capture.y4m";
const W = 640, H = 480, FRAMES = 60;
const matrix = encodeQR("https://usefy.dev/packages/qr-scanner", { level: "Q" });
const scale = 9, margin = 4;
const side = (matrix.size + margin * 2) * scale;

const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F15:1 Ip A1:1 C420mpeg2\n`);
const chunks = [header];

for (let f = 0; f < FRAMES; f++) {
  const y = Buffer.alloc(W * H, 235);
  // Drift the symbol a little so the frames are not identical — a still image
  // would not prove the loop is reading new frames.
  const ox = Math.round((W - side) / 2 + Math.sin(f / 8) * 18);
  const oy = Math.round((H - side) / 2 + Math.cos(f / 11) * 12);

  for (let my = 0; my < matrix.size; my++) {
    for (let mx = 0; mx < matrix.size; mx++) {
      if (!matrix.get(mx, my)) continue;
      const px = ox + (mx + margin) * scale;
      const py = oy + (my + margin) * scale;
      for (let dy = 0; dy < scale; dy++) {
        const row = py + dy;
        if (row < 0 || row >= H) continue;
        for (let dx = 0; dx < scale; dx++) {
          const col = px + dx;
          if (col < 0 || col >= W) continue;
          y[row * W + col] = 16;
        }
      }
    }
  }

  const u = Buffer.alloc((W / 2) * (H / 2), 128);
  const v = Buffer.alloc((W / 2) * (H / 2), 128);
  chunks.push(Buffer.from("FRAME\n"), y, u, v);
}

const video = Buffer.concat(chunks);
writeFileSync(OUT, video);
console.log(`wrote ${OUT} — ${W}×${H}, ${FRAMES} frames, ${(video.length / 1e6).toFixed(1)} MB`);
