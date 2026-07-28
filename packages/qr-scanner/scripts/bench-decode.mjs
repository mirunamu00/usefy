/**
 * Decode benchmark for @usefy/qr-scanner.
 *
 * Measures the internal engine on synthetic frames of the sizes a camera
 * actually produces, so SPEC §4.8's timings are recorded numbers rather than
 * guesses. Reports the median and the 95th percentile: a scanner is judged by
 * its worst frames, not its average one.
 *
 * Usage: pnpm --filter @usefy/qr-scanner build && pnpm --filter @usefy/qr-scanner bench
 */
import { encodeQR } from "@usefy/qr-code/headless";
import { decodeImageData } from "../dist/headless.mjs";

/** Render a symbol into an ImageData-shaped object, centred in a frame. */
function frame(matrix, width, height, scale) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;

  const side = matrix.size * scale;
  const offsetX = Math.floor((width - side) / 2);
  const offsetY = Math.floor((height - side) / 2);

  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.get(x, y)) continue;
      for (let dy = 0; dy < scale; dy++) {
        let index = ((offsetY + y * scale + dy) * width + offsetX + x * scale) * 4;
        for (let dx = 0; dx < scale; dx++) {
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          index += 4;
        }
      }
    }
  }

  return { data, width, height, colorSpace: "srgb" };
}

function percentile(samples, fraction) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function run(label, image, options, iterations = 30) {
  // Warm the JIT before measuring; the first few decodes of a process are not
  // what a scanner's tenth second looks like.
  for (let i = 0; i < 10; i++) decodeImageData(image, options);

  const samples = [];
  let decoded = 0;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const results = decodeImageData(image, options);
    samples.push(performance.now() - start);
    if (results.length > 0) decoded++;
  }

  console.log(
    `${label.padEnd(38)} median ${percentile(samples, 0.5).toFixed(1).padStart(6)} ms   ` +
      `p95 ${percentile(samples, 0.95).toFixed(1).padStart(6)} ms   ` +
      `${decoded === iterations ? "decoded" : `DECODED ${decoded}/${iterations}`}`,
  );
}

const url = "https://usefy.dev/qr-scanner?ref=bench";
const small = encodeQR(url, { version: 3, level: "M" });
const medium = encodeQR(`${url} ${"x".repeat(150)}`, { version: 10, level: "M" });
const large = encodeQR("x".repeat(1200), { version: 40, level: "M" });

console.log("@usefy/qr-scanner decode benchmark (internal engine)\n");

const CASES = [
  ["640×480, v3 symbol", frame(small, 640, 480, 8)],
  ["1280×720, v3 symbol", frame(small, 1280, 720, 12)],
  ["1280×720, v10 symbol", frame(medium, 1280, 720, 8)],
  ["1920×1080, v40 symbol", frame(large, 1920, 1080, 5)],
  ["640×480, nothing to find", frame(small, 640, 480, 0.0001)],
  // A photo straight off a phone's still camera, which is what a file picker
  // hands over — 12 megapixels, and the case the working-resolution cap exists
  // for.
  ["4000×3000, v3 symbol (a photo)", frame(small, 4000, 3000, 20)],
];

for (const [label, image] of CASES) run(label, image, {});

/**
 * The working-resolution cap exists to bound decode time — so whether it
 * actually does is a question with a measurable answer, and the default should
 * follow the measurement rather than the intuition.
 */
console.log("\nSame frames with the cap removed (maxDimension: 0):\n");
for (const [label, image] of CASES) run(`${label}, uncapped`, image, { maxDimension: 0 });
