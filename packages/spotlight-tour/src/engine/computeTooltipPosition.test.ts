import { describe, it, expect } from "vitest";
import { computeTooltipPosition } from "./computeTooltipPosition";

const viewport = { width: 1024, height: 768 };
const tooltip = { width: 300, height: 120 };

describe("computeTooltipPosition", () => {
  describe("basic placement", () => {
    it("places bottom-centered when there is room", () => {
      const result = computeTooltipPosition({
        target: { x: 362, y: 100, width: 300, height: 50 },
        tooltip,
        viewport,
        placement: "bottom",
      });
      expect(result.placement).toBe("bottom");
      // main axis: target bottom + default offset 12
      expect(result.y).toBe(162);
      // cross axis: centered on target center (512)
      expect(result.x).toBe(362);
      // arrow on the top edge, tracking target center
      expect(result.arrow).toEqual({ x: 150, y: 0 });
    });

    it("places top with the arrow on the tooltip's bottom edge", () => {
      const result = computeTooltipPosition({
        target: { x: 362, y: 400, width: 300, height: 50 },
        tooltip,
        viewport,
        placement: "top",
      });
      expect(result.placement).toBe("top");
      expect(result.y).toBe(400 - 12 - 120);
      expect(result.x).toBe(362);
      expect(result.arrow).toEqual({ x: 150, y: 120 });
    });

    it("places right with the arrow on the tooltip's left edge", () => {
      const result = computeTooltipPosition({
        target: { x: 10, y: 300, width: 100, height: 60 },
        tooltip: { width: 200, height: 100 },
        viewport,
        placement: "right",
      });
      expect(result.placement).toBe("right");
      expect(result.x).toBe(10 + 100 + 12);
      expect(result.y).toBe(280); // centered on target center y=330
      expect(result.arrow).toEqual({ x: 0, y: 50 });
    });

    it("places left with the arrow on the tooltip's right edge", () => {
      const result = computeTooltipPosition({
        target: { x: 700, y: 300, width: 100, height: 60 },
        tooltip: { width: 200, height: 100 },
        viewport,
        placement: "left",
      });
      expect(result.placement).toBe("left");
      expect(result.x).toBe(700 - 12 - 200);
      expect(result.y).toBe(280);
      expect(result.arrow).toEqual({ x: 200, y: 50 });
    });

    it("respects a custom offset and viewportMargin", () => {
      const result = computeTooltipPosition({
        target: { x: 0, y: 100, width: 50, height: 50 },
        tooltip,
        viewport,
        placement: "bottom",
        offset: 20,
        viewportMargin: 16,
      });
      expect(result.y).toBe(100 + 50 + 20);
      // shift clamps to the custom margin
      expect(result.x).toBe(16);
    });
  });

  describe("flip", () => {
    it("flips top→bottom when the top overflows", () => {
      const result = computeTooltipPosition({
        target: { x: 362, y: 20, width: 300, height: 50 },
        tooltip,
        viewport,
        placement: "top",
      });
      expect(result.placement).toBe("bottom");
      expect(result.y).toBe(20 + 50 + 12);
    });

    it("flips bottom→top when the bottom overflows", () => {
      const result = computeTooltipPosition({
        target: { x: 362, y: 700, width: 300, height: 50 },
        tooltip,
        viewport,
        placement: "bottom",
      });
      expect(result.placement).toBe("top");
      expect(result.y).toBe(700 - 12 - 120);
    });

    it("flips left→right when the left overflows", () => {
      const result = computeTooltipPosition({
        target: { x: 10, y: 300, width: 100, height: 60 },
        tooltip: { width: 200, height: 100 },
        viewport,
        placement: "left",
      });
      expect(result.placement).toBe("right");
      expect(result.x).toBe(10 + 100 + 12);
    });

    it("flips right→left when the right overflows", () => {
      const result = computeTooltipPosition({
        target: { x: 900, y: 300, width: 100, height: 60 },
        tooltip: { width: 200, height: 100 },
        viewport,
        placement: "right",
      });
      expect(result.placement).toBe("left");
      expect(result.x).toBe(900 - 12 - 200);
    });

    it("uses the roomier side when neither side fits", () => {
      // viewport 500x300, tooltip needs 150+12+8=170; top has 100, bottom has 140
      const result = computeTooltipPosition({
        target: { x: 150, y: 100, width: 200, height: 60 },
        tooltip: { width: 200, height: 150 },
        viewport: { width: 500, height: 300 },
        placement: "top",
      });
      expect(result.placement).toBe("bottom");
    });

    it("keeps the preferred side when neither fits but preferred is roomier", () => {
      // bottom (140) preferred and roomier than top (100) — no flip
      const result = computeTooltipPosition({
        target: { x: 150, y: 100, width: 200, height: 60 },
        tooltip: { width: 200, height: 150 },
        viewport: { width: 500, height: 300 },
        placement: "bottom",
      });
      expect(result.placement).toBe("bottom");
    });
  });

  describe("shift (cross-axis clamping)", () => {
    it("shifts right to stay inside the left viewport margin", () => {
      const result = computeTooltipPosition({
        target: { x: 0, y: 100, width: 50, height: 50 },
        tooltip,
        viewport,
        placement: "bottom",
      });
      expect(result.x).toBe(8); // clamped to default margin
      // arrow still tracks the target center (x=25 → 25-8=17)
      expect(result.arrow.x).toBe(17);
    });

    it("shifts left to stay inside the right viewport margin", () => {
      const result = computeTooltipPosition({
        target: { x: 1000, y: 100, width: 20, height: 50 },
        tooltip,
        viewport,
        placement: "bottom",
      });
      expect(result.x).toBe(1024 - 8 - 300); // 716
    });

    it("shifts vertically for horizontal placements at the top edge", () => {
      const result = computeTooltipPosition({
        target: { x: 100, y: 0, width: 50, height: 30 },
        tooltip: { width: 200, height: 100 },
        viewport,
        placement: "right",
      });
      expect(result.y).toBe(8);
      expect(result.arrow.y).toBe(8); // target center y=15 → 7, clamped to inset
    });

    it("clamps to the margin when the tooltip is wider than the viewport", () => {
      const result = computeTooltipPosition({
        target: { x: 50, y: 20, width: 100, height: 30 },
        tooltip: { width: 300, height: 120 },
        viewport: { width: 200, height: 200 },
        placement: "bottom",
      });
      // usable range is inverted (max < min) → clamps to the min (margin)
      expect(result.x).toBe(8);
    });
  });

  describe("arrow clamping", () => {
    it("clamps the arrow to the tooltip bounds while tracking target center (max side)", () => {
      const result = computeTooltipPosition({
        target: { x: 1000, y: 100, width: 20, height: 50 },
        tooltip,
        viewport,
        placement: "bottom",
      });
      // target center x=1010, tooltip at x=716 → raw 294, clamped to 300-8
      expect(result.arrow.x).toBe(292);
    });

    it("clamps the arrow to the corner inset (min side)", () => {
      const result = computeTooltipPosition({
        target: { x: 0, y: 100, width: 4, height: 50 },
        tooltip,
        viewport,
        placement: "bottom",
      });
      // target center x=2, tooltip at x=8 → raw -6, clamped to inset 8
      expect(result.arrow.x).toBe(8);
    });

    it("shrinks the inset for degenerate (tiny) tooltips", () => {
      const result = computeTooltipPosition({
        target: { x: 0, y: 100, width: 4, height: 20 },
        tooltip: { width: 10, height: 10 },
        viewport,
        placement: "bottom",
      });
      // inset becomes min(8, 10/2)=5, so the arrow pins at 5 instead of 8
      expect(result.arrow.x).toBe(5);
    });

    it("handles a zero-size target rect", () => {
      const result = computeTooltipPosition({
        target: { x: 500, y: 300, width: 0, height: 0 },
        tooltip,
        viewport,
        placement: "bottom",
      });
      expect(result.x).toBe(350);
      expect(result.y).toBe(312);
      expect(result.arrow.x).toBe(150);
    });
  });

  describe("auto placement", () => {
    it("picks bottom when the target is near the top", () => {
      const result = computeTooltipPosition({
        target: { x: 462, y: 20, width: 100, height: 50 },
        tooltip,
        viewport,
        placement: "auto",
      });
      expect(result.placement).toBe("bottom");
    });

    it("picks top when the target is near the bottom", () => {
      const result = computeTooltipPosition({
        target: { x: 462, y: 600, width: 100, height: 100 },
        tooltip,
        viewport,
        placement: "auto",
      });
      expect(result.placement).toBe("top");
    });

    it("picks right when the target hugs the left edge", () => {
      const result = computeTooltipPosition({
        target: { x: 10, y: 334, width: 50, height: 100 },
        tooltip,
        viewport,
        placement: "auto",
      });
      expect(result.placement).toBe("right");
    });

    it("picks left when the target hugs the right edge", () => {
      const result = computeTooltipPosition({
        target: { x: 900, y: 334, width: 100, height: 100 },
        tooltip,
        viewport,
        placement: "auto",
      });
      expect(result.placement).toBe("left");
    });

    it("prefers a fitting side over a roomier side that cannot fit", () => {
      // right has the most raw room (914px) but a 900px-wide tooltip needs
      // 920px there; bottom (408px) actually fits its 100px height → bottom.
      const result = computeTooltipPosition({
        target: { x: 10, y: 300, width: 100, height: 60 },
        tooltip: { width: 900, height: 100 },
        viewport,
        placement: "auto",
      });
      expect(result.placement).toBe("bottom");
    });

    it("falls back to the roomiest side when no side fits", () => {
      // 250x150 tooltip in a 300x200 viewport: nothing fits anywhere;
      // left/right have 100px vs top/bottom 75px → right (tie-break order).
      const result = computeTooltipPosition({
        target: { x: 100, y: 75, width: 100, height: 50 },
        tooltip: { width: 250, height: 150 },
        viewport: { width: 300, height: 200 },
        placement: "auto",
      });
      expect(result.placement).toBe("right");
    });

    it("breaks exact ties in favor of bottom", () => {
      const result = computeTooltipPosition({
        target: { x: 350, y: 350, width: 100, height: 100 },
        tooltip: { width: 100, height: 100 },
        viewport: { width: 800, height: 800 },
        placement: "auto",
      });
      expect(result.placement).toBe("bottom");
    });
  });
});
