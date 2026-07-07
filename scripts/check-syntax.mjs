// Parses every .mjs file at the repo root to catch syntax errors before deploy.
// No build step in this project, so this is the cheapest possible CI gate.
import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const files = readdirSync(".").filter((f) => f.endsWith(".mjs"));
let failed = false;

for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
  } catch {
    failed = true;
  }
}

if (failed) {
  console.error("Syntax check failed.");
  process.exit(1);
}
console.log(`Syntax OK: ${files.length} files.`);
