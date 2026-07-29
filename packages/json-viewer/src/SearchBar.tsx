"use client";

/**
 * Search input, progress, and match navigation (SPEC.md §3.4).
 *
 * The `capped` notice is not decoration: a scan that stopped at 10 000 matches
 * has produced an *incomplete* answer, and showing "1–10 of 10 000" as if it
 * were the whole story is the kind of silent truncation STANDALONE-IDEAS calls
 * out by name.
 */

import styles from "./styles/JsonViewer.module.scss";
import type { JsonSearchProgress } from "./types";

export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  matchCount: number;
  currentMatch: number;
  progress: JsonSearchProgress | null;
  /**
   * True from the keystroke until the scan for *this* query has finished.
   *
   * Not derived from `progress`: between the keystroke and the debounced start
   * there is no progress object yet, and rendering "No matches" in that gap
   * tells the user something false about a query that has plenty.
   */
  scanning: boolean;
  error: string | null;
  onPrevious: () => void;
  onNext: () => void;
}

export function SearchBar({
  query,
  onQueryChange,
  matchCount,
  currentMatch,
  progress,
  scanning,
  error,
  onPrevious,
  onNext,
}: SearchBarProps) {
  const hasMatches = matchCount > 0;

  return (
    <div className={styles.search}>
      <input
        type="search"
        className={styles.input}
        value={query}
        placeholder="Search keys and values…"
        aria-label="Search keys and values"
        data-testid="json-search-input"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          if (event.shiftKey) onPrevious();
          else onNext();
        }}
      />

      {error ? (
        <span className={styles.notice} data-testid="json-search-error">
          {error}
        </span>
      ) : scanning ? (
        <span className={styles.progress} data-testid="json-search-scanning">
          {progress ? `Scanning… ${progress.scanned.toLocaleString()}` : "Scanning…"}
        </span>
      ) : query ? (
        <span className={styles.progress} data-testid="json-search-count">
          {hasMatches ? `${currentMatch + 1} of ${matchCount.toLocaleString()}` : "No matches"}
        </span>
      ) : null}

      {progress?.capped ? (
        <span className={styles.notice} data-testid="json-search-capped">
          {`first ${matchCount.toLocaleString()} only`}
        </span>
      ) : null}

      <button
        type="button"
        className={styles.button}
        onClick={onPrevious}
        disabled={!hasMatches}
        aria-label="Previous match"
      >
        {"↑"}
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onNext}
        disabled={!hasMatches}
        aria-label="Next match"
      >
        {"↓"}
      </button>
    </div>
  );
}
