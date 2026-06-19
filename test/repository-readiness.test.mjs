import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function exists(path) {
  return existsSync(new URL(path, root));
}

test("HACS metadata points to the packaged dist module", () => {
  const hacs = JSON.parse(read("hacs.json"));

  assert.equal(hacs.name, "HACS Home Energy Card");
  assert.equal(hacs.filename, "dist/hacs-home-energy-card.js");
});

test("public testing support files are present", () => {
  const requiredFiles = [
    ".github/workflows/hacs.yml",
    ".github/ISSUE_TEMPLATE/bug_report.yml",
    ".github/ISSUE_TEMPLATE/public_tester_feedback.yml",
    ".github/ISSUE_TEMPLATE/feature_request.yml",
    "docs/public-testing.md",
    "docs/brand-assets.md",
    "docs/images/hacs-home-energy-card-logo.svg",
    "docs/images/hacs-home-energy-card-logo.png",
  ];

  for (const file of requiredFiles) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test("HACS workflow validates the Dashboard plugin category without ignored checks", () => {
  const workflow = read(".github/workflows/hacs.yml");

  assert.match(workflow, /hacs\/action@main/);
  assert.match(workflow, /category:\s+"plugin"/);
  assert.doesNotMatch(workflow, /ignore:/);
});

test("HACS preview docs show the logo, install link, and short setup path", () => {
  const readme = read("README.md");
  const info = read("info.md");

  assert.match(readme, /docs\/images\/hacs-home-energy-card-logo\.png/);
  assert.match(readme, /my\.home-assistant\.io\/redirect\/hacs_repository/);
  assert.match(readme, /\/hacsfiles\/HACS-home-energy-card\/dist\/hacs-home-energy-card\.js/);
  assert.match(info, /docs\/images\/hacs-home-energy-card-logo\.png/);
  assert.match(info, /Public Testing/);
});

test("release package still contains bundled backgrounds beside the card module", () => {
  const expectedDistFiles = [
    "dist/hacs-home-energy-card.js",
    "dist/energy-bg-full-day.png",
    "dist/energy-bg-full-night.png",
    "dist/energy-bg-base-day.png",
    "dist/energy-bg-base-night.png",
  ];

  for (const file of expectedDistFiles) {
    assert.equal(exists(file), true, `${join(".", file)} should exist`);
  }
});
