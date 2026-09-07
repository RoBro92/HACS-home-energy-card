import test from "node:test";
import assert from "node:assert/strict";

import {
  BOTTOM_CARD_OPTIONS,
  buildEnergyModel,
  HacsHomeEnergyCard,
  editorDataFromConfig,
  editorDataToConfig,
  editorFieldsForConfig,
  editorSectionsForConfig,
  entityEnabled,
  formatEnergy,
  formatPower,
  guessStubEntities,
  selectBackground,
  setupBackgroundKey,
  stateValue,
  timeOfDay,
} from "../hacs-home-energy-card.js";

const hass = {
  states: {
    "sensor.grid_power_w": { state: "-1234.4" },
    "sensor.solar_power_w": { state: "4567" },
    "sensor.house_power_w": { state: "2610" },
    "sensor.ev_power_w": { state: "7200" },
    "sensor.ev_soc": { state: "62" },
    "sensor.ev_range": { state: "214", attributes: { unit_of_measurement: "mi", friendly_name: "Car range" } },
    "sensor.ev_inside_temperature": { state: "21.5", attributes: { unit_of_measurement: "°C" } },
    "sensor.ev_odometer": { state: "12842.6", attributes: { unit_of_measurement: "mi" } },
    "binary_sensor.ev_charging": { state: "on" },
    "lock.ev": { state: "locked", attributes: { friendly_name: "EV Lock" } },
    "switch.ev_boost": { state: "off", attributes: { friendly_name: "EV Boost" } },
    "sensor.battery_power_w": { state: "-1450" },
    "sensor.battery_soc": { state: "86" },
    "sensor.battery_capacity_kwh": { state: "13.5", attributes: { unit_of_measurement: "kWh" } },
    "sensor.solar_capacity_kw": { state: "5", attributes: { unit_of_measurement: "kW" } },
    "sensor.solar_pv_voltage": { state: "384", attributes: { unit_of_measurement: "V" } },
    "sensor.solar_pv_current": { state: "11.9", attributes: { unit_of_measurement: "A" } },
    "sensor.solar_efficiency": { state: "91", attributes: { unit_of_measurement: "%" } },
    "sensor.solar_energy_week": { state: "118.3", attributes: { unit_of_measurement: "kWh" } },
    "sensor.solar_energy_month": { state: "432.1", attributes: { unit_of_measurement: "kWh" } },
    "sensor.grid_voltage": { state: "239", attributes: { unit_of_measurement: "V" } },
    "sensor.import_rate": { state: "0.34", attributes: { unit_of_measurement: "GBP/kWh" } },
    "sensor.export_rate": { state: "0.15", attributes: { unit_of_measurement: "GBP/kWh" } },
    "sensor.grid_energy_today": { state: "8.4" },
    "sensor.grid_import_today": { state: "6.2", attributes: { unit_of_measurement: "kWh" } },
    "sensor.grid_export_today": { state: "9.1", attributes: { unit_of_measurement: "kWh" } },
    "sensor.solar_energy_today": { state: "21.6" },
    "sensor.home_energy_today": { state: "14.2" },
    "sensor.ev_energy_today": { state: "18.2", attributes: { unit_of_measurement: "kWh" } },
    "sensor.energy_cost_today": { state: "2.85", attributes: { unit_of_measurement: "GBP" } },
    "sensor.battery_charge_today": { state: "6.4", attributes: { unit_of_measurement: "kWh" } },
    "sensor.battery_discharge_today": { state: "5.7", attributes: { unit_of_measurement: "kWh" } },
    "sensor.outdoor_temperature": { state: "18.4", attributes: { unit_of_measurement: "°C" } },
    "weather.home": { state: "partlycloudy", attributes: { temperature: 18.4, temperature_unit: "°C" } },
    "input_boolean.has_ev": { state: "on" },
    "input_boolean.has_solar": { state: "on" },
    "input_boolean.has_battery": { state: "off" },
    "sun.sun": {
      state: "above_horizon",
      attributes: {
        next_setting: "2026-06-19T21:33:00+01:00",
        next_rising: "2026-06-20T04:42:00+01:00",
      },
    },
  },
};

const baseEntities = {
  sun: "sun.sun",
  grid_power: "sensor.grid_power_w",
  solar_power: "sensor.solar_power_w",
  house_power: "sensor.house_power_w",
};

test("stateValue reads Home Assistant states safely", () => {
  assert.equal(stateValue(hass, "sensor.grid_power_w"), "-1234.4");
  assert.equal(stateValue(hass, "sensor.missing"), "unknown");
  assert.equal(stateValue(null, "sensor.grid_power_w"), "unknown");
});

test("buildEnergyModel supports configurable labels, node extras, bottom cards, rates, and actions", () => {
  const model = buildEnergyModel(
    {
      labels: { grid: "Mains", house: "Kitchen", solar: "PV", ev: "Car", battery: "Powerwall" },
      node_info: {
        grid: { label: "Voltage", entity: "sensor.grid_voltage" },
        solar: "sensor.solar_efficiency",
      },
      tariffs: { currency: "£", import_rate_entity: "sensor.import_rate", export_rate_entity: "sensor.export_rate" },
      bottom_bar: [
        { type: "cost_now", label: "Grid cost" },
        { type: "sun" },
        { type: "entity", label: "Voltage", entity: "sensor.grid_voltage", status: "Grid" },
        "solar",
      ],
      actions: {
        ev: [{ label: "Boost charge", service: "switch.turn_on", target: { entity_id: "switch.ev_boost" } }],
      },
      entities: baseEntities,
    },
    hass,
  );

  assert.equal(model.grid.label, "Mains");
  assert.equal(model.house.label, "Kitchen");
  assert.equal(model.solar.label, "PV");
  assert.equal(model.ev.label, "Car");
  assert.equal(model.battery.label, "Powerwall");
  assert.equal(model.grid.nodeExtra, "Voltage 239 V");
  assert.equal(model.solar.nodeExtra, "91%");
  assert.equal(model.cost.valueLabel, "-£0.19/h");
  assert.equal(model.cost.displayStatus, "Export credit");
  const bottomCards = model.bottomCards.map((card) => [card.kind, card.label, card.status, card.value]);
  assert.deepEqual(bottomCards[0], ["cost", "Grid cost", "Export credit", "-£0.19/h"]);
  assert.deepEqual(bottomCards[1].slice(0, 3), ["sun", "Sunset", "Today"]);
  assert.match(bottomCards[1][3], /\d{1,2}:\d{2}/);
  assert.deepEqual(bottomCards[2], ["entity", "Voltage", "Grid", "239 V"]);
  assert.deepEqual(bottomCards[3], ["solar", "PV", "Producing", "4.6 kW"]);
  assert.equal(model.actions.ev[0].label, "Boost charge");
  assert.equal(model.actions.ev[0].domain, "switch");
  assert.equal(model.actions.ev[0].serviceName, "turn_on");
});

test("buildEnergyModel builds the energy glance cards with value first and caption second", () => {
  const model = buildEnergyModel(
    {
      show_ev: true,
      show_solar: true,
      show_battery: true,
      solar_capacity_kw: 5,
      costs: { today_entity: "sensor.energy_cost_today", daily_budget: 5 },
      tariffs: { import_rate_entity: "sensor.import_rate", export_rate_entity: "sensor.export_rate" },
      bottom_bar: [
        { type: "cost_today" },
        { type: "self_powered_today" },
        { type: "grid_import_export" },
        { type: "battery_reserve" },
        { type: "battery_discharge" },
        { type: "weather" },
      ],
      entities: {
        ...baseEntities,
        weather: "weather.home",
        battery_power: "sensor.battery_power_w",
        battery_soc: "sensor.battery_soc",
        battery_capacity: "sensor.battery_capacity_kwh",
      },
      energy_today: {
        grid_import: "sensor.grid_import_today",
        grid_export: "sensor.grid_export_today",
        battery_discharge: "sensor.battery_discharge_today",
        home: "sensor.home_energy_today",
      },
    },
    hass,
  );

  const cards = Object.fromEntries(model.bottomCards.map((card) => [card.kind, card]));

  assert.equal(model.bottomCards.length, 5, "bottom bar is capped at five cards");
  assert.equal(cards.cost_today.label, "Cost today");
  assert.equal(cards.cost_today.value, "£2.85");
  assert.equal(cards.cost_today.status, "of £5.00 budget");
  assert.equal(cards.cost_today.progress, 57);
  assert.equal(cards.self_powered_today.value, "56%");
  assert.equal(cards.grid_import_export.value, "6.2 / 9.1 kWh");
  assert.equal(cards.grid_import_export.status, "Import / export");
  assert.equal(cards.battery_reserve.status, "At current load");
  assert.match(cards.battery_reserve.value, /^\d+h \d{2}m$/);
  assert.equal(cards.battery_discharge.value, "5.7 kWh");
});

test("buildEnergyModel adds tariff, weather, and daily energy glance cards", () => {
  const model = buildEnergyModel(
    {
      show_ev: true,
      show_battery: true,
      tariffs: { import_rate_entity: "sensor.import_rate", export_rate_entity: "sensor.export_rate" },
      bottom_bar: ["tariff_now", "weather", "solar_today", "home_today", "ev_today", "battery_charge"],
      entities: { ...baseEntities, weather: "weather.home", outdoor_temperature: "sensor.outdoor_temperature" },
      energy_today: {
        solar: "sensor.solar_energy_today",
        home: "sensor.home_energy_today",
        ev: "sensor.ev_energy_today",
        battery_charge: "sensor.battery_charge_today",
      },
    },
    hass,
  );
  const cards = Object.fromEntries(model.bottomCards.map((card) => [card.kind, card]));

  assert.equal(cards.tariff_now.value, "£0.34/kWh");
  assert.equal(cards.tariff_now.status, "Export £0.15/kWh");
  assert.equal(cards.weather.value, "18.4°C");
  assert.equal(cards.weather.status, "Partly cloudy");
  assert.equal(cards.solar_today.value, "21.6 kWh");
  assert.equal(cards.home_today.value, "14.2 kWh");
  assert.equal(cards.ev_today.value, "18.2 kWh");
  assert.equal(model.bottomCards.length, 5);
  assert.deepEqual(
    model.bottomCards.map((card) => card.kind),
    ["tariff_now", "weather", "solar_today", "home_today", "ev_today"],
  );
});

test("buildEnergyModel default bottom bar only shows glance cards that have data", () => {
  const sparse = buildEnergyModel({ entities: baseEntities }, hass);
  assert.deepEqual(
    sparse.bottomCards.map((card) => card.kind),
    ["sun"],
  );

  const rich = buildEnergyModel(
    {
      show_battery: true,
      costs: { today_entity: "sensor.energy_cost_today", daily_budget: 5 },
      entities: {
        ...baseEntities,
        battery_power: "sensor.battery_power_w",
        battery_soc: "sensor.battery_soc",
        battery_capacity: "sensor.battery_capacity_kwh",
      },
      energy_today: {
        grid_import: "sensor.grid_import_today",
        grid_export: "sensor.grid_export_today",
        home: "sensor.home_energy_today",
        solar: "sensor.solar_energy_today",
      },
    },
    hass,
  );
  assert.deepEqual(
    rich.bottomCards.map((card) => card.kind),
    ["cost_today", "self_powered_today", "grid_import_export", "battery_reserve", "solar_today"],
  );
  assert.ok(!rich.bottomCards.some((card) => ["grid", "solar", "ev", "battery"].includes(card.kind)));
});

test("buildEnergyModel hides system specific bottom cards when their systems are disabled", () => {
  const model = buildEnergyModel(
    {
      show_ev: false,
      show_solar: false,
      show_battery: false,
      bottom_bar: [
        { type: "cost", label: "Grid cost" },
        { type: "sun" },
        "solar",
        "ev",
        "battery",
        "solar_today",
        "ev_today",
        "battery_charge",
        { type: "entity", label: "Voltage", entity: "sensor.grid_voltage", status: "Grid" },
      ],
      entities: { sun: "sun.sun", grid_power: "sensor.grid_power_w", house_power: "sensor.house_power_w" },
    },
    hass,
  );

  assert.deepEqual(
    model.bottomCards.map((card) => card.kind),
    ["cost", "sun", "entity"],
  );
});

test("buildEnergyModel turns extra detail sensors into rows and controllable entities into buttons", () => {
  const model = buildEnergyModel(
    {
      show_ev: true,
      detail_entities: {
        ev: {
          range: "sensor.ev_range",
          inside_temperature: "sensor.ev_inside_temperature",
          odometer: "sensor.ev_odometer",
          lock: "lock.ev",
          boost: { label: "Boost", entity: "switch.ev_boost", icon: "mdi:flash" },
        },
      },
      entities: {
        grid_power: "sensor.grid_power_w",
        house_power: "sensor.house_power_w",
        ev_power: "sensor.ev_power_w",
        ev_soc: "sensor.ev_soc",
        ev_charging_state: "binary_sensor.ev_charging",
      },
    },
    hass,
  );

  const rowLabels = model.details.ev.map((row) => row.label);
  const rowValues = Object.fromEntries(model.details.ev.map((row) => [row.label, row.value]));
  const actionLabels = model.actions.ev.map((action) => action.label);

  assert.ok(rowLabels.includes("Range"));
  assert.ok(rowLabels.includes("Inside Temperature"));
  assert.ok(rowLabels.includes("Odometer"));
  assert.equal(rowValues.Range, "214 mi");
  assert.equal(rowValues.Odometer, "12843 mi");
  assert.ok(actionLabels.includes("Unlock"));
  assert.ok(actionLabels.includes("Boost"));
  assert.equal(model.actions.ev.find((action) => action.label === "Unlock").service, "lock.unlock");
  assert.equal(model.actions.ev.find((action) => action.label === "Boost").service, "switch.toggle");
});

test("buildEnergyModel labels listed detail entities from their friendly names", () => {
  const model = buildEnergyModel(
    {
      show_ev: true,
      detail_entities: { ev: ["sensor.ev_range", "lock.ev"] },
      entities: { grid_power: "sensor.grid_power_w", house_power: "sensor.house_power_w", ev_power: "sensor.ev_power_w" },
    },
    hass,
  );

  assert.deepEqual(
    model.details.ev.map((row) => [row.label, row.value]),
    [
      ["Charge power", "7.2 kW"],
      ["Charging state", "Charging"],
      ["Car range", "214 mi"],
    ],
  );
  assert.equal(model.actions.ev[0].label, "Unlock");
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
  assert.equal(timeOfDay({ time_of_day: "night" }, hass), "night");
});

test("buildEnergyModel derives display values, directions, tones, background, and visibility", () => {
  const model = buildEnergyModel(
    {
      show_ev: "input_boolean.has_ev",
      show_solar: "input_boolean.has_solar",
      show_battery: true,
      time_of_day: "night",
      entities: {
        grid_power: "sensor.grid_power_w",
        solar_power: "sensor.solar_power_w",
        solar_capacity: "sensor.solar_capacity_kw",
        house_power: "sensor.house_power_w",
        ev_power: "sensor.ev_power_w",
        ev_soc: "sensor.ev_soc",
        ev_charging_state: "binary_sensor.ev_charging",
        battery_power: "sensor.battery_power_w",
        battery_soc: "sensor.battery_soc",
        battery_capacity: "sensor.battery_capacity_kwh",
      },
      energy_today: { grid: "sensor.grid_energy_today", solar: "sensor.solar_energy_today", home: "sensor.home_energy_today" },
      detail_entities: {
        solar: {
          pv_voltage: "sensor.solar_pv_voltage",
          pv_current: "sensor.solar_pv_current",
          energy_week: "sensor.solar_energy_week",
          energy_month: "sensor.solar_energy_month",
        },
      },
    },
    hass,
  );

  assert.equal(model.setupComplete, true);
  assert.equal(model.showStatusBar, true);
  assert.match(model.background, /energy-bg-full-night\.png$/);
  assert.deepEqual(model.visible, { ev: true, solar: true, battery: true });
  assert.equal(model.mode, "night");
  assert.equal(model.grid.status, "exporting");
  assert.equal(model.grid.displayStatus, "Exporting");
  assert.equal(model.grid.tone, "export");
  assert.equal(model.grid.active, true);
  assert.equal(model.grid.powerLabel, "1.2 kW");
  assert.equal(model.solar.powerLabel, "4.6 kW");
  assert.equal(model.solar.efficiencyLabel, "91%");
  assert.equal(model.solar.statusLabel, "Producing · 91%");
  assert.equal(model.house.powerLabel, "2.6 kW");
  assert.equal(model.ev.status, "charging");
  assert.equal(model.ev.tone, "charging");
  assert.equal(model.ev.socLabel, "62%");
  assert.equal(model.ev.pillValue, "7.2 kW · 62%");
  assert.equal(model.battery.status, "discharging");
  assert.equal(model.battery.tone, "discharging");
  assert.equal(model.battery.socLabel, "86%");
  assert.equal(model.battery.capacityLabel, "13.5 kWh");
  assert.equal(model.battery.statusLabel, "Discharging · 86%");
  assert.equal(model.energyToday.solar, "21.6 kWh");
  assert.deepEqual(
    model.details.solar.map((row) => [row.label, row.value, row.entityId]),
    [
      ["Solar power", "4.6 kW", "sensor.solar_power_w"],
      ["Efficiency", "91%", undefined],
      ["Generated today", "21.6 kWh", "sensor.solar_energy_today"],
      ["PV voltage", "384 V", "sensor.solar_pv_voltage"],
      ["PV current", "11.9 A", "sensor.solar_pv_current"],
      ["Generated this week", "118.3 kWh", "sensor.solar_energy_week"],
      ["Generated this month", "432.1 kWh", "sensor.solar_energy_month"],
    ],
  );
});

test("buildEnergyModel treats idle systems as inactive and uses sentence case statuses", () => {
  const idleHass = {
    states: {
      ...hass.states,
      "sensor.grid_power_w": { state: "12" },
      "sensor.solar_power_w": { state: "0" },
      "binary_sensor.ev_charging": { state: "off" },
    },
  };
  const model = buildEnergyModel(
    {
      show_ev: true,
      solar_capacity_kw: 5,
      entities: { ...baseEntities, ev_power: "sensor.ev_power_w", ev_charging_state: "binary_sensor.ev_charging" },
    },
    idleHass,
  );

  assert.equal(model.grid.active, false);
  assert.equal(model.grid.tone, "idle");
  assert.equal(model.grid.statusLabel, "Idle");
  assert.equal(model.solar.statusLabel, "Idle");
  assert.equal(model.ev.statusLabel, "Not charging");
});

test("buildEnergyModel reports incomplete setup instead of throwing", () => {
  const model = buildEnergyModel({ entities: { grid_power: "sensor.grid_power_w" } }, hass);
  assert.equal(model.setupComplete, false);
  assert.equal(model.house.powerLabel, "-");
  assert.equal(model.grid.powerLabel, "1.2 kW");

  const card = new HacsHomeEnergyCard();
  assert.doesNotThrow(() => card.setConfig({}));
  assert.throws(() => card.setConfig(null), /configuration object/);
});

test("buildEnergyModel exposes sizing and bottom bar options from config", () => {
  const model = buildEnergyModel(
    {
      show_bottom_bar: false,
      card_width: 920,
      card_height: 520,
      min_width: 480,
      min_height: 270,
      entities: { grid_power: "sensor.grid_power_w", house_power: "sensor.house_power_w" },
    },
    hass,
  );

  assert.equal(model.showStatusBar, false);
  assert.equal(model.size.width, "920px");
  assert.equal(model.size.height, "520px");
  assert.equal(model.size.minWidth, "480px");
  assert.equal(model.size.minHeight, "270px");
});

test("buildEnergyModel exposes a dist background fallback for HACS source installs", () => {
  const model = buildEnergyModel(
    {
      show_ev: false,
      show_solar: false,
      show_battery: false,
      time_of_day: "night",
      entities: { grid_power: "sensor.grid_power_w", house_power: "sensor.house_power_w" },
    },
    hass,
  );

  assert.match(model.background, /energy-bg-base-night\.png$/);
  assert.match(model.backgroundFallback, /dist\/energy-bg-base-night\.png$/);
});

test("buildEnergyModel clamps configured card dimensions to usable minimums", () => {
  const model = buildEnergyModel(
    {
      card_width: 100,
      card_height: 100,
      min_width: 100,
      min_height: 100,
      entities: { grid_power: "sensor.grid_power_w", house_power: "sensor.house_power_w" },
    },
    hass,
  );

  assert.equal(model.size.width, "320px");
  assert.equal(model.size.height, "180px");
});

test("buildEnergyModel calculates solar efficiency from configured capacity", () => {
  const model = buildEnergyModel({ show_solar: true, solar_capacity_kw: 5, entities: baseEntities }, hass);

  assert.equal(model.solar.efficiencyLabel, "91%");
  assert.equal(model.solar.pillValue, "4.6 kW · 91%");
});

test("getStubConfig renders the full demo setup without hass and guesses sensors from a real instance", () => {
  const stub = HacsHomeEnergyCard.getStubConfig();
  assert.equal(stub.show_ev, true);
  assert.equal(stub.show_solar, true);
  assert.equal(stub.show_battery, true);
  assert.equal(stub.time_of_day, undefined, "stub must not pin the scene to day or night");
  assert.equal(stub.entities.grid_power, "sensor.grid_power_w");
  assert.equal(stub.entities.house_power, "sensor.house_power_w");

  const realHass = {
    states: {
      "sensor.octopus_grid_import_power": { state: "1200", attributes: { device_class: "power", friendly_name: "Grid import power" } },
      "sensor.house_load": { state: "900", attributes: { device_class: "power", friendly_name: "House load" } },
      "sensor.inverter_pv_power": { state: "3000", attributes: { device_class: "power", friendly_name: "Inverter PV power" } },
      "sensor.powerwall_battery": { state: "80", attributes: { device_class: "battery", friendly_name: "Powerwall charge" } },
      "sensor.random_temperature": { state: "20", attributes: { device_class: "temperature" } },
      "sensor.phone_battery": { state: "50", attributes: { device_class: "battery", friendly_name: "Phone battery" } },
    },
  };
  const guessed = HacsHomeEnergyCard.getStubConfig(realHass);
  assert.equal(guessed.entities.grid_power, "sensor.octopus_grid_import_power");
  assert.equal(guessed.entities.house_power, "sensor.house_load");
  assert.equal(guessed.entities.solar_power, "sensor.inverter_pv_power");
  assert.equal(guessed.entities.battery_soc, "sensor.powerwall_battery");
  assert.equal(guessed.entities.ev_power, undefined);
  assert.equal(guessed.show_solar, true);
  assert.equal(guessed.show_battery, true);
  assert.equal(guessed.show_ev, false);
  assert.deepEqual(guessStubEntities({ states: {} }), {});
});

test("editor mapping exposes native selector data and preserves unrelated config on partial edits", () => {
  const config = {
    show_ev: true,
    show_solar: true,
    show_battery: true,
    time_of_day: "day",
    entities: { grid_power: "sensor.grid_power_w", house_power: "sensor.house_power_w", solar_power: "sensor.solar_power_w" },
    detail_entities: { solar: { pv_voltage: "sensor.solar_pv_voltage" } },
    actions: { ev: [{ label: "Boost", service: "switch.turn_on" }] },
  };

  const data = editorDataFromConfig(config);
  assert.equal(data.grid_power, "sensor.grid_power_w");
  assert.equal(data.house_power, "sensor.house_power_w");
  assert.equal(data.show_ev, true);
  assert.deepEqual(data.solar_detail, ["sensor.solar_pv_voltage"]);

  const next = editorDataToConfig(config, { ...data, show_ev: false, show_solar: false, show_battery: false, time_of_day: "auto" });
  assert.equal(next.show_ev, false);
  assert.equal(next.show_solar, false);
  assert.equal(next.show_battery, false);
  assert.equal(next.time_of_day, undefined);
  assert.equal(next.entities.grid_power, "sensor.grid_power_w");
  assert.deepEqual(next.detail_entities.solar, { pv_voltage: "sensor.solar_pv_voltage" }, "untouched detail objects keep their keys");
  assert.deepEqual(next.actions, config.actions, "YAML only options survive editor round trips");
});

test("editor detail extras add and remove entities while keeping custom entries", () => {
  const config = {
    show_ev: true,
    detail_entities: { ev: { range: "sensor.ev_range", boost: { label: "Boost", entity: "switch.ev_boost", icon: "mdi:flash" } } },
  };
  const data = editorDataFromConfig(config);
  assert.deepEqual(data.ev_detail, ["sensor.ev_range", "switch.ev_boost"]);

  const added = editorDataToConfig(config, { ...data, ev_detail: ["sensor.ev_range", "switch.ev_boost", "lock.ev"] });
  assert.deepEqual(added.detail_entities.ev, [
    "sensor.ev_range",
    { key: "boost", label: "Boost", entity: "switch.ev_boost", icon: "mdi:flash" },
    "lock.ev",
  ]);

  const removed = editorDataToConfig(added, { ...editorDataFromConfig(added), ev_detail: [] });
  assert.equal(removed.detail_entities, undefined);
});

test("editorFieldsForConfig hides disabled system sections without deleting saved YAML", () => {
  const config = {
    show_ev: false,
    show_solar: false,
    show_battery: false,
    solar_capacity_kw: 5,
    entities: { grid_power: "sensor.grid_power_w", house_power: "sensor.house_power_w", solar_power: "sensor.solar_power_w", ev_power: "sensor.ev_power_w", battery_power: "sensor.battery_power_w" },
    detail_entities: { solar: { pv_voltage: "sensor.solar_pv_voltage" }, ev: { range: "sensor.ev_range" }, battery: { voltage: "sensor.battery_voltage" } },
  };

  const visibleNames = editorFieldsForConfig(config);
  assert.ok(visibleNames.includes("show_solar"));
  assert.ok(visibleNames.includes("grid_power"));
  assert.ok(!visibleNames.includes("solar_power"));
  assert.ok(!visibleNames.includes("solar_capacity_kw"));
  assert.ok(!visibleNames.includes("ev_power"));
  assert.ok(!visibleNames.includes("battery_power"));

  const next = editorDataToConfig(config, editorDataFromConfig(config));
  assert.equal(next.entities.solar_power, "sensor.solar_power_w");
  assert.equal(next.detail_entities.ev.range, "sensor.ev_range");
  assert.equal(next.detail_entities.battery.voltage, "sensor.battery_voltage");
});

test("editorSectionsForConfig groups fields into setup, system, energy, cost, bottom bar, and appearance sections", () => {
  const sections = editorSectionsForConfig({ show_ev: true, show_solar: true, show_battery: true });
  assert.deepEqual(
    sections.map((section) => section.key),
    ["setup", "solar", "battery", "ev", "energy", "cost", "bottom_bar", "appearance"],
  );
  assert.equal(sections[0].expanded, true);
  assert.ok(sections.every((section) => section.visible));

  const allNames = editorFieldsForConfig({ show_ev: true, show_solar: true, show_battery: true });
  assert.deepEqual([...new Set(allNames)].sort(), allNames.toSorted(), "no field appears twice");
  assert.ok(allNames.includes("bottom_bar_slot_5"));
  assert.ok(!allNames.includes("title"));
  assert.ok(!allNames.includes("node_detail"));

  const disabled = editorSectionsForConfig({ show_ev: false, show_solar: false, show_battery: false });
  assert.deepEqual(
    disabled.filter((section) => section.visible).map((section) => section.key),
    ["setup", "energy", "cost", "bottom_bar", "appearance"],
  );
});

test("editor bottom bar slots keep legacy items, add custom entity fields, and follow system toggles", () => {
  const config = {
    show_battery: false,
    bottom_bar: [{ type: "cost_today", label: "Daily spend" }, { type: "self_powered_today" }, { type: "entity", entity: "sensor.grid_voltage", label: "Voltage" }],
  };

  const data = editorDataFromConfig(config);
  assert.equal(data.bottom_bar_slot_1, "cost_today");
  assert.equal(data.bottom_bar_slot_1_label, "Daily spend");
  assert.equal(data.bottom_bar_slot_3, "entity");
  assert.equal(data.bottom_bar_slot_3_entity, "sensor.grid_voltage");
  assert.equal(data.bottom_bar_slot_4, "none");

  const bottomSection = editorSectionsForConfig(config).find((section) => section.key === "bottom_bar");
  const slotOptions = bottomSection.schema.find((entry) => entry.name === "bottom_bar_slot_1").selector.select.options.map((option) => option.value);
  assert.ok(slotOptions.includes("tariff_now"));
  assert.ok(!slotOptions.includes("battery_reserve"), "battery cards hide while the battery is off");
  assert.ok(bottomSection.schema.some((entry) => entry.type === "grid" && entry.schema.some((field) => field.name === "bottom_bar_slot_3_entity")));

  const next = editorDataToConfig(config, {
    ...data,
    bottom_bar_slot_2: "grid_import_export",
    bottom_bar_slot_3_entity: "sensor.grid_voltage",
    bottom_bar_slot_3_label: "Mains voltage",
    bottom_bar_slot_4: "sun",
    bottom_bar_slot_5: "none",
  });

  assert.deepEqual(next.bottom_bar, [
    { type: "cost_today", label: "Daily spend" },
    { type: "grid_import_export" },
    { type: "entity", entity: "sensor.grid_voltage", label: "Mains voltage" },
    { type: "sun" },
  ]);
  assert.ok(BOTTOM_CARD_OPTIONS.some((option) => option.value === "entity"));
});

test("selectBackground prefers setup and time specific background variants", () => {
  const config = {
    backgrounds: {
      full: { day: "/local/full-day.jpg", night: "/local/full-night.jpg" },
      no_ev: { day: "/local/no-ev-day.jpg", night: "/local/no-ev-night.jpg" },
      ev_only: { day: "/local/ev-only-day.jpg", night: "/local/ev-only-night.jpg" },
      base: { day: "/local/base-day.jpg", night: "/local/base-night.jpg" },
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
  assert.equal(selectBackground(config, { ev: false, solar: true, battery: true }, "day"), "/local/no-ev-day.jpg", "no_ev alias still works");
  assert.equal(selectBackground(config, { ev: true, solar: false, battery: false }, "night"), "/local/ev-only-night.jpg");
  assert.equal(selectBackground(config, { ev: false, solar: false, battery: false }, "day"), "/local/base-day.jpg");
  assert.match(selectBackground(config, { ev: false, solar: true, battery: false }, "day"), /energy-bg-solar-only-day\.png$/, "missing keys fall back to bundled images");
});

test("selectBackground falls back to bundled module relative assets", () => {
  assert.match(selectBackground({}, { ev: true, solar: true, battery: true }, "day"), /energy-bg-full-day\.png$/);
  assert.match(selectBackground({}, { ev: false, solar: false, battery: false }, "night"), /energy-bg-base-night\.png$/);
  assert.equal(selectBackground({ background_full: "/local/mine.jpg" }, { ev: true, solar: true, battery: true }, "day"), "/local/mine.jpg");
});

test("buildEnergyModel reverses EV status when an EV sensor reports discharge power", () => {
  const v2gHass = { states: { ...hass.states, "sensor.ev_power_w": { state: "-1800" } } };
  const model = buildEnergyModel({ show_ev: true, entities: { ...baseEntities, ev_power: "sensor.ev_power_w" } }, v2gHass);

  assert.equal(model.ev.status, "discharging");
  assert.equal(model.ev.tone, "discharging");
});
