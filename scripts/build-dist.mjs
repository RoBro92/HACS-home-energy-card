import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const { version } = JSON.parse(await readFile("package.json", "utf8"));

const distDir = "dist";
const assetsDir = "demo/assets";
const backgrounds = [
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

// The card imports lit as a bare specifier. Bundling inlines lit so the
// published module has no runtime dependency on a CDN.
await build({
  entryPoints: ["hacs-home-energy-card.js"],
  outfile: join(distDir, "HACS-home-energy-card.js"),
  bundle: true,
  format: "esm",
  target: ["es2022"],
  minify: true,
  define: { __CARD_VERSION__: JSON.stringify(version) },
  legalComments: "inline",
  logLevel: "warning",
});

for (const file of backgrounds) {
  await copyFile(join(assetsDir, file), join(distDir, file));
}

console.log(`Built ${distDir}/ with ${backgrounds.length + 1} files.`);
