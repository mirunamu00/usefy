/**
 * Script to copy mock memory reports to Storybook public directory
 * Runs automatically before storybook build via prebuild-storybook hook
 */

const fs = require("fs");
const path = require("path");

const SOURCE_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "memory-monitor",
  "mock-reports"
);

const DEST_DIR = path.join(__dirname, "..", "public", "reports");

function copyReports() {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log(`Created directory: ${DEST_DIR}`);
  }

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`Source directory not found: ${SOURCE_DIR}`);
    console.log("Run 'pnpm generate:mock-reports' in memory-monitor first.");
    return;
  }

  // Get all HTML files from source
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".html"));

  if (files.length === 0) {
    console.log("No HTML reports found in source directory.");
    console.log("Run 'pnpm generate:mock-reports' in memory-monitor first.");
    return;
  }

  // Copy each file
  files.forEach((file) => {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(DEST_DIR, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file}`);
  });

  console.log(`\nSuccessfully copied ${files.length} report(s) to public/reports/`);
  console.log("These will be available at /reports/<filename> after deployment.");
}

copyReports();
