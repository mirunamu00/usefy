import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Every file under `dir`, repo-relative and sorted, so the walk order is stable. */
export function skillFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1
    )) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(dir);
  return out;
}

/**
 * Content hash of a whole skill directory: every file's path and bytes.
 *
 * Line endings are normalised to \n first — this repo is developed on Windows
 * with autocrlf, so the working copy of a file differs from the same file on a
 * Linux CI runner. Hashing raw bytes would make the guard fail by platform
 * instead of by drift.
 */
export function hashSkillDir(dir) {
  const h = createHash("sha256");
  for (const file of skillFiles(dir)) {
    const rel = relative(dir, file).split(sep).join("/");
    h.update(rel + "\n");
    h.update(readFileSync(file, "utf8").replace(/\r\n/g, "\n"));
  }
  return h.digest("hex");
}
