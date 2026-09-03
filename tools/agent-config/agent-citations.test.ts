/**
 * Guard: the agent briefs in `.claude/agents/` must not cite things that don't exist.
 *
 * A brief is prose, so nothing compiles it and nothing breaks when a skill is
 * renamed or a file moves — the citation just quietly becomes a lie the agent
 * acts on. Two kinds of citation are checked:
 *
 * 1. **Skill citations**, written with one of two markers the briefs already use:
 *    a bold code span (**`add-usefy-hook`**) or a code span followed by the word
 *    "skill" (`code-review` skill). Each must name an installed project skill
 *    under `.claude/skills/`, or appear in EXTERNAL_SKILLS below.
 * 2. **File-path citations** — a code span that looks like a real repo path
 *    (has a file extension). Each must match a tracked file.
 *
 * Skill names are cited BARE, never namespaced (`webapp-testing`, not
 * `example-skills:webapp-testing`): a plugin's namespace is its version hash and
 * changes on every update, and the agent resolves a bare name from its own skill
 * list anyway. The Skill tool returns the skill's base directory as its first
 * line, so briefs never need to hardcode a skill's path either.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..", "..");
const AGENT_DIR = join(REPO_ROOT, ".claude", "agents");
const SKILL_DIR = join(REPO_ROOT, ".claude", "skills");

/**
 * Skills a brief may cite that do not live in `.claude/skills/` — Claude Code
 * built-ins and plugin skills. Listed explicitly so that adding a dependency on
 * an outside skill is a deliberate edit rather than a typo that silently passes.
 */
const EXTERNAL_SKILLS = new Set([
  "code-review", // built-in: the generic correctness pass the reviewer delegates to
  "simplify", // built-in: reuse/simplification cleanup
  "run", // built-in: launch and drive the app to see a change working
  "webapp-testing", // example-skills plugin: Playwright-driven browser QA
]);

const installedSkills = new Set(
  readdirSync(SKILL_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
);

const trackedFiles = execSync("git ls-files", {
  cwd: REPO_ROOT,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
})
  .split("\n")
  .filter(Boolean);

const agentBriefs = readdirSync(AGENT_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ name: f, text: readFileSync(join(AGENT_DIR, f), "utf8") }));

/** `**\`name\`**` or "`name` skill" — the two markers the briefs use for a skill. */
function skillCitations(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\*\*`([^`\n]+)`\*\*/g)) found.add(m[1]);
  for (const m of text.matchAll(/`([^`\n]+)`\s+skill/g)) found.add(m[1]);
  // A leading slash is how the briefs write a slash-command invocation.
  return [...found].map((s) => s.replace(/^\//, ""));
}

const FILE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|css|scss|md|ya?ml)$/;

/** Code spans that name a real repo file — not npm packages, globs, or build output. */
function pathCitations(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const c = m[1].trim();
    if (!FILE_EXT.test(c)) continue;
    if (c.startsWith("@") || c.startsWith("./") || c.startsWith("dist/")) continue;
    if (/[<>*\s]/.test(c)) continue; // templated (`use-<name>`) or a command line
    found.add(c);
  }
  return [...found];
}

describe("agent briefs cite only things that exist", () => {
  it("has agent briefs to check", () => {
    expect(agentBriefs.length).toBeGreaterThan(0);
  });

  describe.each(agentBriefs)("$name", ({ text }) => {
    it("cites only installed or explicitly-allowed skills", () => {
      const unknown = skillCitations(text).filter(
        (s) => !installedSkills.has(s) && !EXTERNAL_SKILLS.has(s)
      );
      expect(unknown).toEqual([]);
    });

    it("cites only file paths that exist", () => {
      const missing = pathCitations(text).filter(
        (c) => !trackedFiles.some((f) => f === c || f.endsWith("/" + c))
      );
      expect(missing).toEqual([]);
    });
  });
});

describe("agent frontmatter preloads only installed skills", () => {
  it.each(agentBriefs)("$name", ({ text }) => {
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const declared = frontmatter.match(/^skills:\s*\[([^\]]*)\]/m)?.[1];
    if (declared === undefined) return; // preloading is optional
    const names = declared
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((n) => !installedSkills.has(n))).toEqual([]);
  });
});
