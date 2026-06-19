import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEnergyModel,
  entityEnabled,
  flowSpeedSeconds,
  formatEnergy,
  formatPower,
  selectBackground,
  setupBackgroundKey,
  stateValue,
  timeOfDay,
} from "../energy-home-visual-card.js";

const hass = {
  states: {
    "sensor.grid_power_w": { state: "-1234.4" },
    "sensor.solar_power_w": { state: "4567" },
    "sensor.house_power_w": { state: "2610" },
    "sensor.ev_power_w": { state: "7200" },
    "sensor.battery_power_w": { state: "-1450" },
    "sensor.battery_soc": { state: "86" },
    "sensor.grid_energy_today": { state: "8.4" },
    "sensor.solar_energy_today": { state: "21.6" },
    "sensor.home_energy_today": { state: "14.2" },
    "input_boolean.has_ev": { state: "on" },
    "input_boolean.has_solar": { state: "on" },
    "input_boolean.has_battery": { state: "off" },
    "sun.sun": { state: "above_horizon" },
  },
};

test("stateValue reads Home Assistant states safely", () => {
  assert.equal(stateValue(hass, "sensor.grid_power_w"), "-1234.4");
  assert.equal(stateValue(hass, "sensor.missing"), "unknown");
  assert.equal(stateValue(null, "sensor.grid_power_w"), "unknown");
});

test("formatPower keeps watts for small values and switches to kW for larger values", () => {
  assert.equal(formatPower(87), "87 W");
  assert.equal(formatPower(1234.4), "1.2 kW");
  assert.equal(formatPower(-2550), "2.6 kW");
  assert.equal(formatPower("unknown"), "-");
});

test("formatEnergy renders daily energy with kWh units", () => {
  assert.equal(formatEnergy("8.44"), "8.4 kWh");
  assert.equal(formatEnergy("0"), "0.0 kWh");
  assert.equal(formatEnergy("unavailable"), "-");
});

test("entityEnabled accepts booleans and common Home Assistant boolean entity states", () => {
  assert.equal(entityEnabled(true, hass), true);
  assert.equal(entityEnabled(false, hass), false);
  assert.equal(entityEnabled("input_boolean.has_ev", hass), true);
  assert.equal(entityEnabled("input_boolean.has_battery", hass), false);
  assert.equal(entityEnabled(undefined, hass, true), true);
});

test("timeOfDay uses sun.sun before falling back to local clock", () => {
  assert.equal(timeOfDay({}, hass, new Date("2026-06-18T23:00:00+01:00")), "day");
  assert.equal(
    timeOfDay({}, { states: { "sun.sun": { state: "below_horizon" } } }, new Date("2026-06-18T12:00:00+01:00")),
    "night",
  );
  assert.equal(timeOfDay({}, { states: {} }, new Date("2026-06-18T12:00:00+01:00")), "day");
  assert.equal(timeOfDay({}, { states: {} }, new Date("2026-06-18T22:00:00+01:00")), "night");
});

test("flowSpeedSeconds makes stronger power flows animate faster with sane bounds", () => {
  assert.equal(flowSpeedSeconds(0), 0);
  assert.equal(flowSpeedSeconds(50), 8);
  assert.ok(flowSpeedSeconds(900) < flowSpeedSeconds(100));
  assert.equal(flowSpeedSeconds(9000), 1.2);
});

test("buildEnergyModel derives display values, directions, background, and visibility", () => {
  const model = buildEnergyModel(
    {
      background_full: "/local/energy-bg-full.jpg",
      background_no_ev: "/local/energy-bg-no-ev.jpg",
      show_ev: "input_boolean.has_ev",
      show_solar: "input_boolean.has_solar",
      show_battery: true,
      time_of_day: "night",
      entities: {
        grid_power: "sensor.grid_power_w",
        solar_power: "sensor.solar_power_w",
        house_power: "sensor.house_power_w",
        ev_power: "sensor.ev_power_w",
        battery_power: "sensor.battery_power_w",
        battery_soc: "sensor.battery_soc",
      },
      energy_today: {
        grid: "sensor.grid_energy_today",
        solar: "sensor.solar_energy_today",
        home: "sensor.home_energy_today",
      },
    },
    hass,
  );

  assert.match(model.background, /energy-bg-full-night\.png$/);
  assert.equal(model.visible.ev, true);
  assert.equal(model.visible.solar, true);
  assert.equal(model.visible.battery, true);
  assert.equal(model.mode, "night");
  assert.equal(model.grid.status, "exporting");
  assert.equal(model.grid.powerLabel, "1.2 kW");
  assert.equal(model.solar.powerLabel, "4.6 kW");
  assert.equal(model.house.powerLabel, "2.6 kW");
  assert.equal(model.ev.status, "charging");
  assert.equal(model.battery.status, "discharging");
  assert.equal(model.battery.socLabel, "86%");
  assert.equal(model.energyToday.solar, "21.6 kWh");
  assert.equal(Object.hasOwn(model, "weather"), false);
});

test("selectBackground prefers setup and time-specific background variants", () => {
  const config = {
    backgrounds: {
      full: { day: "/local/full-day.jpg", night: "/local/full-night.jpg" },
      ev_solar: { day: "/local/ev-solar-day.jpg", night: "/local/ev-solar-night.jpg" },
      ev_battery: { day: "/local/ev-battery-day.jpg", night: "/local/ev-battery-night.jpg" },
      solar_battery: { day: "/local/solar-battery-day.jpg", night: "/local/solar-battery-night.jpg" },
      no_ev: { day: "/local/no-ev-day.jpg", night: "/local/no-ev-night.jpg" },
      no_solar_battery: {
        day: "/local/no-solar-battery-day.jpg",
        night: "/local/no-solar-battery-night.jpg",
      },
      ev_only: { day: "/local/ev-only-day.jpg", night: "/local/ev-only-night.jpg" },
      solar_only: { day: "/local/solar-only-day.jpg", night: "/local/solar-only-night.jpg" },
      battery_only: { day: "/local/battery-only-day.jpg", night: "/local/battery-only-night.jpg" },
      base: {
        day: "/local/base-day.jpg",
        night: "/local/base-night.jpg",
      },
    },
  };

  assert.equal(setupBackgroundKey({ ev: true, solar: true, battery: true }), "full");
  assert.equal(setupBackgroundKey({ ev: true, solar: true, battery: false }), "ev_solar");
  assert.equal(setupBackgroundKey({ ev: true, solar: false, battery: true }), "ev_battery");
  assert.equal(setupBackgroundKey({ ev: false, solar: true, battery: true }), "solar_battery");
  assert.equal(setupBackgroundKey({ ev: true, solar: false, battery: false }), "ev_only");
  assert.equal(setupBackgroundKey({ ev: false, solar: true, battery: false }), "solar_only");
  assert.equal(setupBackgroundKey({ ev: false, solar: false, battery: true }), "battery_only");
  assert.equal(setupBackgroundKey({ ev: false, solar: false, battery: false }), "base");
  assert.equal(selectBackground(config, { ev: false, solar: true, battery: true }, "day"), "/local/solar-battery-day.jpg");
  assert.equal(selectBackground(config, { ev: true, solar: false, battery: false }, "night"), "/local/ev-only-night.jpg");
  assert.equal(selectBackground(config, { ev: false, solar: false, battery: false }, "day"), "/local/base-day.jpg");
});

test("selectBackground falls back to bundled module-relative assets", () => {
  assert.match(selectBackground({}, { ev: true, solar: true, battery: true }, "day"), /energy-bg-full-day\.png$/);
  assert.match(selectBackground({}, { ev: false, solar: false, battery: false }, "night"), /energy-bg-base-night\.png$/);
});

test("buildEnergyModel reverses EV flow when an EV sensor reports discharge power", () => {
  const v2gHass = {
    states: {
      ...hass.states,
      "sensor.ev_power_w": { state: "-1800" },
    },
  };

  const model = buildEnergyModel(
    {
      show_ev: true,
      entities: {
        grid_power: "sensor.grid_power_w",
        solar_power: "sensor.solar_power_w",
        house_power: "sensor.house_power_w",
        ev_power: "sensor.ev_power_w",
      },
    },
    v2gHass,
  );

  assert.equal(model.ev.status, "discharging");
  assert.equal(model.flows.find((item) => item.name === "ev").direction, "discharging");
});
