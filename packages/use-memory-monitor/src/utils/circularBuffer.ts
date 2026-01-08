/**
 * A fixed-size circular buffer (ring buffer) for efficient history storage.
 * Provides O(1) push operations and automatically overwrites oldest entries
 * when capacity is reached.
 *
 * @template T - Type of items stored in the buffer
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private _size: number = 0;
  private readonly _capacity: number;

  /**
   * Create a new circular buffer with the specified capacity
   *
   * @param capacity - Maximum number of items the buffer can hold
   * @throws Error if capacity is less than 1
   */
  constructor(capacity: number) {
    if (capacity < 1) {
      throw new Error("CircularBuffer capacity must be at least 1");
    }

    this._capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add an item to the buffer.
   * If the buffer is full, the oldest item will be overwritten.
   *
   * @param item - Item to add
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this._capacity;

    if (this._size < this._capacity) {
      this._size++;
    } else {
      // Buffer is full, move head forward (overwrite oldest)
      this.head = (this.head + 1) % this._capacity;
    }
  }

  /**
   * Get all items in the buffer as an array, from oldest to newest.
   *
   * @returns Array of items in insertion order (oldest first)
   */
  toArray(): T[] {
    const result: T[] = [];

    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this._capacity;
      result.push(this.buffer[index] as T);
    }

    return result;
  }

  /**
   * Get the most recent N items from the buffer.
   *
   * @param count - Number of items to retrieve
   * @returns Array of most recent items (oldest first within the slice)
   */
  getRecent(count: number): T[] {
    const actualCount = Math.min(count, this._size);
    const result: T[] = [];

    const startOffset = this._size - actualCount;
    for (let i = 0; i < actualCount; i++) {
      const index = (this.head + startOffset + i) % this._capacity;
      result.push(this.buffer[index] as T);
    }

    return result;
  }

  /**
   * Get the most recently added item.
   *
   * @returns The most recent item, or undefined if buffer is empty
   */
  get last(): T | undefined {
    if (this._size === 0) {
      return undefined;
    }

    const lastIndex = (this.tail - 1 + this._capacity) % this._capacity;
    return this.buffer[lastIndex];
  }

  /**
   * Get the oldest item in the buffer.
   *
   * @returns The oldest item, or undefined if buffer is empty
   */
  get first(): T | undefined {
    if (this._size === 0) {
      return undefined;
    }

    return this.buffer[this.head];
  }

  /**
   * Get an item at a specific index (0 = oldest).
   *
   * @param index - Index of the item to retrieve
   * @returns The item at the index, or undefined if out of bounds
   */
  at(index: number): T | undefined {
    if (index < 0 || index >= this._size) {
      return undefined;
    }

    const bufferIndex = (this.head + index) % this._capacity;
    return this.buffer[bufferIndex];
  }

  /**
   * Current number of items in the buffer.
   */
  get size(): number {
    return this._size;
  }

  /**
   * Maximum capacity of the buffer.
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * Check if the buffer is empty.
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Check if the buffer is full.
   */
  get isFull(): boolean {
    return this._size === this._capacity;
  }

  /**
   * Clear all items from the buffer.
   */
  clear(): void {
    this.buffer = new Array(this._capacity);
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }

  /**
   * Iterate over all items in the buffer (oldest to newest).
   */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this._capacity;
      yield this.buffer[index] as T;
    }
  }

  /**
   * Apply a function to each item in the buffer.
   *
   * @param callback - Function to call for each item
   */
  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this._size; i++) {
      const bufferIndex = (this.head + i) % this._capacity;
      callback(this.buffer[bufferIndex] as T, i);
    }
  }

  /**
   * Map items to a new array.
   *
   * @param callback - Function to transform each item
   * @returns Array of transformed items
   */
  map<U>(callback: (item: T, index: number) => U): U[] {
    const result: U[] = [];

    for (let i = 0; i < this._size; i++) {
      const bufferIndex = (this.head + i) % this._capacity;
      result.push(callback(this.buffer[bufferIndex] as T, i));
    }

    return result;
  }

  /**
   * Filter items based on a predicate.
   *
   * @param predicate - Function to test each item
   * @returns Array of items that pass the test
   */
  filter(predicate: (item: T, index: number) => boolean): T[] {
    const result: T[] = [];

    for (let i = 0; i < this._size; i++) {
      const bufferIndex = (this.head + i) % this._capacity;
      const item = this.buffer[bufferIndex] as T;

      if (predicate(item, i)) {
        result.push(item);
      }
    }

    return result;
  }
}
