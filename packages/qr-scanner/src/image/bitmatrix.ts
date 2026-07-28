/**
 * A rectangular grid of bits — the currency of every stage after
 * binarization, and of the sampled module grid the decoder reads.
 *
 * One byte per bit rather than a packed `Uint32Array`: the whole pipeline is
 * random-access (finder cross-checks walk diagonals, the sampler jumps to
 * arbitrary module centres), and byte indexing keeps that branch-free. A
 * 800 × 800 working frame costs 640 KB, which is reused across frames rather
 * than reallocated.
 */
export class BitMatrix {
  readonly data: Uint8Array;

  constructor(readonly width: number, readonly height: number, data?: Uint8Array) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new RangeError(`BitMatrix dimensions must be positive integers, got ${width}×${height}`);
    }
    if (data && data.length !== width * height) {
      throw new RangeError(
        `BitMatrix data must be ${width * height} bytes for ${width}×${height}, got ${data.length}`,
      );
    }
    this.data = data ?? new Uint8Array(width * height);
  }

  /** A square matrix — what a sampled module grid always is. */
  static square(size: number, data?: Uint8Array): BitMatrix {
    return new BitMatrix(size, size, data);
  }

  /** Modules per side. Only meaningful for a square (module-grid) matrix. */
  get size(): number {
    return this.width;
  }

  get(x: number, y: number): boolean {
    return this.data[y * this.width + x] === 1;
  }

  /** `get` for coordinates that may fall outside the image; outside reads light. */
  getSafe(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.data[y * this.width + x] === 1;
  }

  set(x: number, y: number, value: boolean): void {
    this.data[y * this.width + x] = value ? 1 : 0;
  }

  /** Count of dark bits — used by the detector to reject empty regions cheaply. */
  countDark(): number {
    let count = 0;
    for (let i = 0; i < this.data.length; i++) count += this.data[i]!;
    return count;
  }

  /**
   * A copy with every bit flipped — the inverted pass (SPEC §3.7 `invert`).
   * Inverting the *bitmap* rather than re-binarizing the luminance keeps the
   * expensive half of the pipeline (thresholding) to one run per frame.
   */
  inverted(): BitMatrix {
    const flipped = new Uint8Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) flipped[i] = this.data[i]! ^ 1;
    return new BitMatrix(this.width, this.height, flipped);
  }

  /**
   * A transposed copy — reading a mirrored symbol.
   *
   * A mirrored QR is the original reflected across its main diagonal, so
   * transposing the sampled module grid turns it back into a readable symbol
   * without re-running detection.
   */
  transposed(): BitMatrix {
    const out = new Uint8Array(this.data.length);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        out[x * this.height + y] = this.data[y * this.width + x]!;
      }
    }
    return new BitMatrix(this.height, this.width, out);
  }

  /**
   * Multi-line debug rendering (`#` dark, `.` light). Used by tests and by
   * anyone diagnosing a sampling bug — a grid you can read beats a hex dump.
   */
  toString(): string {
    const rows: string[] = [];
    for (let y = 0; y < this.height; y++) {
      let row = "";
      for (let x = 0; x < this.width; x++) row += this.data[y * this.width + x] === 1 ? "#" : ".";
      rows.push(row);
    }
    return rows.join("\n");
  }

  /** Parse the `toString` format — the ergonomic way to write a fixture. */
  static fromString(text: string): BitMatrix {
    const rows = text
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row.length > 0);
    if (rows.length === 0) throw new RangeError("Cannot build a BitMatrix from empty text");

    const width = rows[0]!.length;
    const matrix = new BitMatrix(width, rows.length);
    rows.forEach((row, y) => {
      if (row.length !== width) {
        throw new RangeError(`Row ${y} is ${row.length} wide, expected ${width}`);
      }
      for (let x = 0; x < width; x++) {
        matrix.set(x, y, row[x] === "#" || row[x] === "1");
      }
    });
    return matrix;
  }
}
