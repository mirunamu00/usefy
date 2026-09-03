/**
 * Guard: the vendored skills under `.claude/skills/` stay what they were
 * vendored as, and don't silently lose to a personal copy of the same name.
 *
 * Four of this repo's skills were copied in from upstream repos. Nothing
 * compiles them, so an accidental edit — or an upstream re-sync that half
 * landed — leaves no trace. `vendored-skills.json` pins each one's content;
 * this test enforces it. (It replaces `skills-lock.json`, which recorded the
 * same thing but was read by nothing, so it could never have caught drift.)
 *
 * The second half covers a subtler failure. A skill name that exists in BOTH
 * `~/.claude/skills/` and this repo resolves to the personal copy, so the
 * version committed here is not the version an agent on that machine gets.
 * The two are identical today; if they ever diverge, whoever has both should
 * find out from a failing test rather than from an agent following
 * instructions nobody can see in the repo. That half only runs on a machine
 * that actually has personal skills — it skips everywhere else, CI included.
 */
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { hashSkillDir, skillFiles } from "./skill-hash.mjs";

const REPO_ROOT = join(__dirname, "..", "..");
const SKILL_ROOT = join(REPO_ROOT, ".claude", "skills");
const PERSONAL_SKILL_ROOT = join(homedir(), ".claude", "skills");

const manifest = JSON.parse(
  readFileSync(join(__dirname, "vendored-skills.json"), "utf8")
) as {
  skills: Record<
    string,
    { source: string; skillPath: string; fileCount: number; contentHash: string }
  >;
};

const vendored = Object.entries(manifest.skills);

describe("vendored skills match their pinned content", () => {
  it.each(vendored)("%s", (name, entry) => {
    const dir = join(SKILL_ROOT, name);
    expect(existsSync(dir), `${name} is in the manifest but not installed`).toBe(true);
    // File count first: it turns "a rules/ file went missing" into a clearer
    // failure than a hash mismatch alone would give.
    expect(skillFiles(dir).length).toBe(entry.fileCount);
    expect(
      hashSkillDir(dir),
      `${name} drifted from ${entry.source}. If you re-synced it on purpose, run ` +
        `\`node tools/agent-config/hash-vendored-skills.mjs\` and commit the manifest.`
    ).toBe(entry.contentHash);
  });

  it("manifest lists no skill that was uninstalled", () => {
    const installed = new Set(readdirSync(SKILL_ROOT));
    expect(vendored.map(([n]) => n).filter((n) => !installed.has(n))).toEqual([]);
  });
});

/** Project skills whose name is also installed personally, so the personal one wins. */
function shadowedSkills(): string[] {
  if (!existsSync(PERSONAL_SKILL_ROOT)) return [];
  const personal = new Set(readdirSync(PERSONAL_SKILL_ROOT));
  return readdirSync(SKILL_ROOT).filter((n) => personal.has(n));
}

const shadowed = shadowedSkills();

describe.skipIf(shadowed.length === 0)(
  "a personal skill that shadows a project skill still matches it",
  () => {
    it.each(shadowed)("%s", (name) => {
      // Personal skills are often symlinks into ~/.agents/skills; resolve first.
      const personalDir = realpathSync(join(PERSONAL_SKILL_ROOT, name));
      expect(
        hashSkillDir(personalDir),
        `~/.claude/skills/${name} shadows .claude/skills/${name} and the two have ` +
          `diverged, so agents on this machine are NOT reading the version committed ` +
          `here. Re-sync one from the other, or remove the personal copy.`
      ).toBe(hashSkillDir(join(SKILL_ROOT, name)));
    });
  }
);
