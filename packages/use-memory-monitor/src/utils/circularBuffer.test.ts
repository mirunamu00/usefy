import { describe, it, expect } from "vitest";
import { CircularBuffer } from "./circularBuffer";

describe("CircularBuffer", () => {
  describe("constructor", () => {
    it("should create a buffer with specified capacity", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.capacity).toBe(5);
      expect(buffer.size).toBe(0);
    });

    it("should throw error for capacity less than 1", () => {
      expect(() => new CircularBuffer<number>(0)).toThrow(
        "CircularBuffer capacity must be at least 1"
      );
      expect(() => new CircularBuffer<number>(-1)).toThrow(
        "CircularBuffer capacity must be at least 1"
      );
    });
  });

  describe("push", () => {
    it("should add items to the buffer", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.size).toBe(3);
      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it("should overwrite oldest items when full", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.size).toBe(3);
      expect(buffer.toArray()).toEqual([2, 3, 4]);
    });

    it("should handle continuous overflow correctly", () => {
      const buffer = new CircularBuffer<number>(3);

      for (let i = 1; i <= 10; i++) {
        buffer.push(i);
      }

      expect(buffer.size).toBe(3);
      expect(buffer.toArray()).toEqual([8, 9, 10]);
    });
  });

  describe("toArray", () => {
    it("should return empty array for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.toArray()).toEqual([]);
    });

    it("should return items in insertion order", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it("should return items in correct order after overflow", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      expect(buffer.toArray()).toEqual([3, 4, 5]);
    });
  });

  describe("getRecent", () => {
    it("should return most recent N items", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      expect(buffer.getRecent(3)).toEqual([3, 4, 5]);
      expect(buffer.getRecent(2)).toEqual([4, 5]);
      expect(buffer.getRecent(1)).toEqual([5]);
    });

    it("should return all items if count exceeds size", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.getRecent(10)).toEqual([1, 2, 3]);
    });

    it("should return empty array for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.getRecent(3)).toEqual([]);
    });

    it("should work correctly after overflow", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      expect(buffer.getRecent(2)).toEqual([4, 5]);
    });
  });

  describe("last", () => {
    it("should return the most recently added item", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.last).toBe(3);
    });

    it("should return undefined for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.last).toBeUndefined();
    });

    it("should return correct item after overflow", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.last).toBe(4);
    });
  });

  describe("first", () => {
    it("should return the oldest item", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.first).toBe(1);
    });

    it("should return undefined for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.first).toBeUndefined();
    });

    it("should return correct item after overflow", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.first).toBe(2);
    });
  });

  describe("at", () => {
    it("should return item at specified index", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(10);
      buffer.push(20);
      buffer.push(30);

      expect(buffer.at(0)).toBe(10);
      expect(buffer.at(1)).toBe(20);
      expect(buffer.at(2)).toBe(30);
    });

    it("should return undefined for out of bounds index", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);

      expect(buffer.at(-1)).toBeUndefined();
      expect(buffer.at(2)).toBeUndefined();
      expect(buffer.at(10)).toBeUndefined();
    });

    it("should work correctly after overflow", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.at(0)).toBe(2);
      expect(buffer.at(1)).toBe(3);
      expect(buffer.at(2)).toBe(4);
    });
  });

  describe("size and capacity", () => {
    it("should track size correctly", () => {
      const buffer = new CircularBuffer<number>(5);

      expect(buffer.size).toBe(0);
      buffer.push(1);
      expect(buffer.size).toBe(1);
      buffer.push(2);
      expect(buffer.size).toBe(2);
    });

    it("should not exceed capacity", () => {
      const buffer = new CircularBuffer<number>(3);

      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      expect(buffer.size).toBe(3);
      expect(buffer.capacity).toBe(3);
    });
  });

  describe("isEmpty and isFull", () => {
    it("should return true for empty buffer", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.isEmpty).toBe(true);
      expect(buffer.isFull).toBe(false);
    });

    it("should return false after adding items", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);

      expect(buffer.isEmpty).toBe(false);
      expect(buffer.isFull).toBe(false);
    });

    it("should return true when full", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.isEmpty).toBe(false);
      expect(buffer.isFull).toBe(true);
    });
  });

  describe("clear", () => {
    it("should clear all items", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      buffer.clear();

      expect(buffer.size).toBe(0);
      expect(buffer.isEmpty).toBe(true);
      expect(buffer.toArray()).toEqual([]);
    });

    it("should allow adding items after clear", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.clear();
      buffer.push(10);
      buffer.push(20);

      expect(buffer.toArray()).toEqual([10, 20]);
    });
  });

  describe("iterator", () => {
    it("should iterate over all items", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const items = [...buffer];
      expect(items).toEqual([1, 2, 3]);
    });

    it("should iterate in correct order after overflow", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      const items = [...buffer];
      expect(items).toEqual([2, 3, 4]);
    });
  });

  describe("forEach", () => {
    it("should call callback for each item", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const items: number[] = [];
      const indices: number[] = [];

      buffer.forEach((item, index) => {
        items.push(item);
        indices.push(index);
      });

      expect(items).toEqual([1, 2, 3]);
      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe("map", () => {
    it("should transform items", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const doubled = buffer.map((n) => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });

    it("should pass index to callback", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(10);
      buffer.push(20);
      buffer.push(30);

      const withIndex = buffer.map((n, i) => `${i}:${n}`);
      expect(withIndex).toEqual(["0:10", "1:20", "2:30"]);
    });
  });

  describe("filter", () => {
    it("should filter items based on predicate", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      const evens = buffer.filter((n) => n % 2 === 0);
      expect(evens).toEqual([2, 4]);
    });

    it("should return empty array when no items match", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(3);
      buffer.push(5);

      const evens = buffer.filter((n) => n % 2 === 0);
      expect(evens).toEqual([]);
    });
  });

  describe("generic types", () => {
    it("should work with objects", () => {
      interface Item {
        id: number;
        name: string;
      }

      const buffer = new CircularBuffer<Item>(3);
      buffer.push({ id: 1, name: "first" });
      buffer.push({ id: 2, name: "second" });

      expect(buffer.last).toEqual({ id: 2, name: "second" });
    });

    it("should work with strings", () => {
      const buffer = new CircularBuffer<string>(3);
      buffer.push("a");
      buffer.push("b");
      buffer.push("c");

      expect(buffer.toArray()).toEqual(["a", "b", "c"]);
    });
  });
});
