import { readFileSync } from "node:fs";

// Prints the CHANGELOG.md section for one version, used as the GitHub release body.
const version = process.argv[2];
if (!version) {
  console.error("usage: node scripts/release-notes.mjs <version>");
  process.exit(1);
}

const lines = readFileSync("CHANGELOG.md", "utf8").split("\n");
const start = lines.findIndex((line) => line.trim() === `## ${version}`);
if (start === -1) {
  console.error(`No CHANGELOG.md section for ${version}`);
  process.exit(1);
}
let end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
if (end === -1) end = lines.length;

process.stdout.write(`${lines.slice(start + 1, end).join("\n").trim()}\n`);
