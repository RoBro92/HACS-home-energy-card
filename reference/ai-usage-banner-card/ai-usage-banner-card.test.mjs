import test from "node:test";
import assert from "node:assert/strict";

import {
  clampPercent,
  formatPercent,
  formatResetTime,
  logoTypeForModel,
  logoUrlForModel,
  stateValue,
} from "./ai-usage-banner-card.js";

test("clampPercent keeps numeric sensor values in the 0 to 100 range", () => {
  assert.equal(clampPercent("62.52"), 62.52);
  assert.equal(clampPercent("-3"), 0);
  assert.equal(clampPercent("140"), 100);
  assert.equal(clampPercent("unknown"), null);
});

test("formatPercent renders missing values as an em dash", () => {
  assert.equal(formatPercent("97.0"), "97%");
  assert.equal(formatPercent("62.52"), "63%");
  assert.equal(formatPercent("unknown"), "-");
});

test("formatResetTime renders future ISO timestamps as compact remaining time", () => {
  const now = new Date("2026-06-18T18:00:00+01:00");

  assert.equal(formatResetTime("2026-06-18T20:14:00+01:00", now), "2h 14m");
  assert.equal(formatResetTime("2026-06-19T09:00:00+01:00", now), "15h");
  assert.equal(formatResetTime("2026-06-20T10:30:00+01:00", now), "1d 16h");
  assert.equal(formatResetTime("unknown", now), "-");
  assert.equal(formatResetTime("2026-06-18T17:59:00+01:00", now), "now");
});

test("stateValue reads Home Assistant entity state safely", () => {
  const hass = {
    states: {
      "sensor.example": { state: "42" },
    },
  };

  assert.equal(stateValue(hass, "sensor.example"), "42");
  assert.equal(stateValue(hass, "sensor.missing"), "unknown");
  assert.equal(stateValue(null, "sensor.example"), "unknown");
});

test("logoTypeForModel chooses provider marks from model names", () => {
  assert.equal(logoTypeForModel({ name: "AGY GEMINI" }), "gemini");
  assert.equal(logoTypeForModel({ name: "AGY CLAUDE & GPT" }), "claude");
  assert.equal(logoTypeForModel({ name: "CODEX GPT" }), "gpt");
  assert.equal(logoTypeForModel({ name: "Other Model" }), "ai");
});

test("logoUrlForModel returns HTTP logo assets", () => {
  assert.equal(logoUrlForModel({ name: "AGY GEMINI" }), "https://cdn.simpleicons.org/googlegemini/54f2ef");
  assert.equal(logoUrlForModel({ name: "AGY CLAUDE & GPT" }), "https://cdn.simpleicons.org/claude/b9a7ff");
  assert.equal(
    logoUrlForModel({ name: "CODEX GPT" }),
    "https://upload.wikimedia.org/wikipedia/commons/6/66/OpenAI_logo_2025_%28symbol%29.svg",
  );
  assert.equal(logoUrlForModel({ logo: "https://example.test/logo.svg" }), "https://example.test/logo.svg");
});
