// Parses every .mjs file (root + functions/api) to catch syntax errors
// before deploy, and validates every JSON file the app reads at runtime
// (a malformed data file fails silently in the browser otherwise). No
// build step in this project, so this is the cheapest possible CI gate.
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const jsFiles = [
  ...readdirSync(".").filter((f) => f.endsWith(".mjs")),
  ...readdirSync("functions/api").map((f) => `functions/api/${f}`),
];
let failed = false;

for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
  } catch {
    failed = true;
  }
}

const jsonFiles = [
  ...readdirSync("data").map((f) => `data/${f}`),
  "manifest.json",
  "package.json",
];
for (const file of jsonFiles) {
  try {
    JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`Invalid JSON in ${file}: ${err.message}`);
    failed = true;
  }
}

if (failed) {
  console.error("Syntax check failed.");
  process.exit(1);
}
console.log(`Syntax OK: ${jsFiles.length} JS files, ${jsonFiles.length} JSON files.`);
