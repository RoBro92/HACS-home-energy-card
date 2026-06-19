import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const distDir = "dist";
const assetsDir = "demo/assets";
const files = [
  "energy-bg-full-day.png",
  "energy-bg-full-night.png",
  "energy-bg-ev-solar-day.png",
  "energy-bg-ev-solar-night.png",
  "energy-bg-ev-battery-day.png",
  "energy-bg-ev-battery-night.png",
  "energy-bg-no-ev-day.png",
  "energy-bg-no-ev-night.png",
  "energy-bg-no-solar-battery-day.png",
  "energy-bg-no-solar-battery-night.png",
  "energy-bg-solar-only-day.png",
  "energy-bg-solar-only-night.png",
  "energy-bg-battery-only-day.png",
  "energy-bg-battery-only-night.png",
  "energy-bg-base-day.png",
  "energy-bg-base-night.png",
];

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await copyFile("hacs-home-energy-card.js", join(distDir, "HACS-home-energy-card.js"));

for (const file of files) {
  await copyFile(join(assetsDir, file), join(distDir, file));
}

console.log(`Built ${distDir}/ with ${files.length + 1} files.`);
