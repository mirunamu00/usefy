import { describe, expect, it } from "vitest";
import type { SignaturePoint } from "../types";
import { filterPoints, passesMinDistance, pointDistance } from "./filterPoints";

const P = (x: number, y: number, time = 0, pressure = 0): SignaturePoint => ({
  x,
  y,
  time,
  pressure,
});

describe("pointDistance", () => {
  it("computes euclidean distance (3-4-5 triangle)", () => {
    expect(pointDistance(P(0, 0), P(3, 4))).toBe(5);
    expect(pointDistance(P(1, 1), P(1, 1))).toBe(0);
  });
});

describe("passesMinDistance", () => {
  it("accepts at exactly the threshold (>=) and rejects below it", () => {
    expect(passesMinDistance(P(0, 0), P(2, 0), 2)).toBe(true);
    expect(passesMinDistance(P(0, 0), P(1.999, 0), 2)).toBe(false);
  });

  it("accepts everything (even exact duplicates) when minDistance <= 0", () => {
    expect(passesMinDistance(P(5, 5), P(5, 5), 0)).toBe(true);
    expect(passesMinDistance(P(5, 5), P(5, 5), -1)).toBe(true);
  });
});

describe("filterPoints", () => {
  it("returns [] for empty input", () => {
    expect(filterPoints([], 2)).toEqual([]);
  });

  it("always keeps the first point (by reference)", () => {
    const p = P(1, 2);
    const kept = filterPoints([p], 2);
    expect(kept).toHaveLength(1);
    expect(kept[0]).toBe(p);
  });

  it("drops points closer than minDistance to the last KEPT point", () => {
    // 1.5 is 1.5px from (0,0) → dropped; 3 is 3px from (0,0) → kept.
    const kept = filterPoints([P(0, 0), P(1.5, 0), P(3, 0)], 2);
    expect(kept.map((p) => p.x)).toEqual([0, 3]);
  });

  it("measures against the last kept point, not the previous raw point", () => {
    // consecutive raw gaps are all 1px (< 2) but cumulative gaps pass:
    // 0 kept; 1 dropped (1 < 2); 2 kept (2 >= 2); 3 dropped (1 from 2).
    const kept = filterPoints([P(0, 0), P(1, 0), P(2, 0), P(3, 0)], 2);
    expect(kept.map((p) => p.x)).toEqual([0, 2]);
  });

  it("keeps everything when minDistance is 0", () => {
    const pts = [P(0, 0), P(0, 0), P(0.5, 0)];
    expect(filterPoints(pts, 0)).toHaveLength(3);
  });

  it("does not mutate the input array", () => {
    const pts = [P(0, 0), P(1, 0), P(5, 0)];
    filterPoints(pts, 2);
    expect(pts).toHaveLength(3);
  });
});
