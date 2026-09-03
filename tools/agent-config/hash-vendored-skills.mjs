/**
 * Regenerate `vendored-skills.json` from what is currently on disk.
 *
 *   node tools/agent-config/hash-vendored-skills.mjs
 *
 * Run this after deliberately re-syncing a vendored skill from upstream, then
 * commit the manifest with the skill change. The `source` fields are carried
 * forward from the existing manifest — a new vendored skill needs its source
 * added there by hand.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashSkillDir, skillFiles } from "./skill-hash.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, "vendored-skills.json");
const SKILL_ROOT = join(HERE, "..", "..", ".claude", "skills");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
for (const [name, entry] of Object.entries(manifest.skills)) {
  const dir = join(SKILL_ROOT, name);
  entry.fileCount = skillFiles(dir).length;
  entry.contentHash = hashSkillDir(dir);
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Updated ${Object.keys(manifest.skills).length} entries in ${MANIFEST}`);
