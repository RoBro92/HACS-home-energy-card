import { LitElement, html, css } from "lit";

const MODULE_BASE_URL = new URL(".", import.meta.url);
const ACTIVE_THRESHOLD_W = 25;
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 19;
const MIN_CARD_WIDTH_PX = 320;
const MIN_CARD_HEIGHT_PX = 180;
const MAX_BOTTOM_CARDS = 5;
const SCENE_FADE_MS = 1400;
const DEFAULT_CURRENCY = "£";
const SYSTEM_GROUPS = ["grid", "solar", "house", "ev", "battery"];

function moduleAsset(path) {
  return new URL(path, MODULE_BASE_URL).href;
}

function bundledAsset(path) {
  const basePath = MODULE_BASE_URL.pathname || "";
  const alreadyInDist = basePath.endsWith("/dist/");
  return {
    default: moduleAsset(path),
    fallback: alreadyInDist ? null : moduleAsset(`dist/${path}`),
  };
}

const DEFAULT_BACKGROUNDS = {
  full: { day: bundledAsset("energy-bg-full-day.png"), night: bundledAsset("energy-bg-full-night.png") },
  ev_solar: { day: bundledAsset("energy-bg-ev-solar-day.png"), night: bundledAsset("energy-bg-ev-solar-night.png") },
  ev_battery: { day: bundledAsset("energy-bg-ev-battery-day.png"), night: bundledAsset("energy-bg-ev-battery-night.png") },
  solar_battery: { day: bundledAsset("energy-bg-no-ev-day.png"), night: bundledAsset("energy-bg-no-ev-night.png") },
  ev_only: { day: bundledAsset("energy-bg-no-solar-battery-day.png"), night: bundledAsset("energy-bg-no-solar-battery-night.png") },
  solar_only: { day: bundledAsset("energy-bg-solar-only-day.png"), night: bundledAsset("energy-bg-solar-only-night.png") },
  battery_only: { day: bundledAsset("energy-bg-battery-only-day.png"), night: bundledAsset("energy-bg-battery-only-night.png") },
  base: { day: bundledAsset("energy-bg-base-day.png"), night: bundledAsset("energy-bg-base-night.png") },
};

// Documented aliases for background setup keys. Everything else is the canonical key.
const BACKGROUND_ALIASES = {
  solar_battery: ["solar_battery", "no_ev"],
  ev_only: ["ev_only", "no_solar_battery"],
};

// ---------------------------------------------------------------------------
// State helpers and formatting
// ---------------------------------------------------------------------------

export function stateValue(hass, entityId) {
  if (!hass || !entityId || !hass.states || !hass.states[entityId]) return "unknown";
  return hass.states[entityId].state ?? "unknown";
}

export function stateAttributes(hass, entityId) {
  if (!hass || !entityId || !hass.states || !hass.states[entityId]) return {};
  return hass.states[entityId].attributes || {};
}

export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const normalised = String(value).replace(/,/g, "").trim();
  if (!normalised || normalised === "unknown" || normalised === "unavailable") return null;
  const parsed = Number.parseFloat(normalised);
  return Number.isFinite(parsed) ? parsed : null;
}

function stateNumber(hass, entityId) {
  return parseNumber(stateValue(hass, entityId));
}

function unitOf(hass, entityId) {
  return String(stateAttributes(hass, entityId).unit_of_measurement || "").toLowerCase();
}

function pixelDimension(value, minimum) {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  return `${Math.max(minimum, Math.round(parsed))}px`;
}

function cardSizeModel(config) {
  const minWidth = pixelDimension(config.min_width, MIN_CARD_WIDTH_PX) || `${MIN_CARD_WIDTH_PX}px`;
  const minHeight = pixelDimension(config.min_height, MIN_CARD_HEIGHT_PX) || `${MIN_CARD_HEIGHT_PX}px`;
  return {
    width: pixelDimension(config.card_width, parseNumber(minWidth) ?? MIN_CARD_WIDTH_PX),
    height: pixelDimension(config.card_height, parseNumber(minHeight) ?? MIN_CARD_HEIGHT_PX),
    minWidth,
    minHeight,
  };
}

export function formatPower(value) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  const watts = Math.abs(parsed);
  if (watts >= 1000) return `${(Math.round((watts / 1000) * 10) / 10).toFixed(1)} kW`;
  return `${Math.round(watts)} W`;
}

export function formatEnergy(value) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  return `${parsed.toFixed(1)} kWh`;
}

function formatHours(value) {
  const parsed = parseNumber(value);
  if (parsed === null || parsed < 0) return "-";
  const totalMinutes = Math.round(parsed * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatPercent(value) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  return `${Math.max(0, Math.min(100, Math.round(parsed)))}%`;
}

function optionalPercent(value) {
  const label = formatPercent(value);
  return label === "-" ? null : label;
}

function formatBatteryCapacity(value) {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  return `${Math.round(parsed * 10) / 10} kWh`;
}

function formatMoney(value, currency) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  return `${parsed < 0 ? "-" : ""}${currency}${Math.abs(parsed).toFixed(2)}`;
}

function formatRate(value, currency) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  return `${currency}${parsed.toFixed(parsed < 1 ? 3 : 2).replace(/0$/, "")}/kWh`;
}

function formatTemperature(value, unit = "°C") {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  return `${Math.round(parsed * 10) / 10}${unit || "°C"}`;
}

function formatEventTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function progressPercent(value, target) {
  const parsed = parseNumber(value);
  const parsedTarget = parseNumber(target);
  if (parsed === null || parsedTarget === null || parsedTarget <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((parsed / parsedTarget) * 100)));
}

function sentenceCase(value) {
  const raw = String(value ?? "");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function titleCaseLabel(value) {
  return String(value ?? "").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function joinLabels(parts, separator = " · ") {
  return parts.filter((part) => part && part !== "-").join(separator);
}

function normaliseStateLabel(value, fallback) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw || raw === "unknown" || raw === "unavailable") return fallback;
  if (["on", "true", "charging"].includes(raw)) return "charging";
  if (["off", "false", "not_charging", "not charging"].includes(raw)) return "not charging";
  return raw.replace(/_/g, " ");
}

function entityDisplayValue(hass, entityId) {
  const value = stateValue(hass, entityId);
  if (value === "unknown" || value === "unavailable") return "-";
  const unit = stateAttributes(hass, entityId).unit_of_measurement;
  if (unit === "%") return `${value}%`;
  return unit ? `${value} ${unit}` : String(value);
}

function entityDomain(entityId) {
  return String(entityId || "").split(".")[0];
}

function entityName(hass, entityId, fallback) {
  return stateAttributes(hass, entityId).friendly_name || fallback || labelFromDetailKey(String(entityId || "").split(".").pop());
}

// ---------------------------------------------------------------------------
// Labels, icons, colours
// ---------------------------------------------------------------------------

const DETAIL_LABELS = {
  pv_voltage: "PV voltage",
  pv_current: "PV current",
  voltage: "Voltage",
  current: "Current",
  energy_24h: "Energy last 24h",
  energy_today: "Generated today",
  energy_week: "Generated this week",
  energy_month: "Generated this month",
  import_24h: "Imported last 24h",
  export_24h: "Exported last 24h",
  charge_24h: "Charged last 24h",
  discharge_24h: "Discharged last 24h",
  soc: "State of charge",
  state: "State",
};

const DEFAULT_LABELS = {
  grid: "Grid",
  gridCard: "Electricity",
  solar: "Solar",
  house: "Home",
  ev: "EV",
  evCard: "Electric Vehicle",
  battery: "Battery",
};

const ICONS = {
  grid: "mdi:transmission-tower",
  cost: "mdi:cash",
  tariff: "mdi:cash-clock",
  selfPowered: "mdi:home-lightning-bolt",
  solar: "mdi:solar-power-variant",
  solarToday: "mdi:white-balance-sunny",
  house: "mdi:home",
  houseToday: "mdi:home-lightning-bolt-outline",
  ev: "mdi:car-electric",
  evToday: "mdi:ev-station",
  battery: "mdi:home-battery",
  batteryReserve: "mdi:battery-clock",
  batteryCharge: "mdi:battery-arrow-up",
  batteryDischarge: "mdi:battery-arrow-down",
  sun: "mdi:weather-sunset",
  weather: "mdi:weather-partly-cloudy",
  entity: "mdi:information-outline",
};

const COLORS = {
  grid: "#58bfff",
  export: "#5ef2a1",
  cost: "#8ee6a5",
  selfPowered: "#7ee8ff",
  solar: "#ffd15a",
  house: "#ffffff",
  ev: "#50eaff",
  battery: "#56f0d0",
  discharge: "#ffb86b",
  sun: "#ffb86b",
  weather: "#a7d8ff",
  entity: "#d9f2ff",
};

// Tones drive node ring colour and the status dot. Idle nodes stay neutral.
const TONE_COLORS = {
  import: COLORS.grid,
  export: COLORS.export,
  producing: COLORS.solar,
  consuming: COLORS.house,
  charging: COLORS.battery,
  discharging: COLORS.discharge,
  idle: "rgba(255, 255, 255, .42)",
};

function labelFromDetailKey(key) {
  if (DETAIL_LABELS[key]) return DETAIL_LABELS[key];
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function configLabels(config = {}) {
  return { ...DEFAULT_LABELS, ...(config.labels || {}) };
}

function nodeExtraLabel(config, hass, key) {
  const entry = config.node_info?.[key];
  if (!entry) return null;
  if (typeof entry === "string") return entityDisplayValue(hass, entry);
  if (typeof entry === "object" && entry.entity) {
    const value = entityDisplayValue(hass, entry.entity);
    if (!value || value === "-") return null;
    return entry.label ? `${entry.label} ${value}` : value;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Capacity, tariffs and cost
// ---------------------------------------------------------------------------

function solarCapacityWatts(config, hass, entities) {
  const configured = parseNumber(config.solar_capacity_kw);
  if (configured !== null) return configured * 1000;
  const parsed = stateNumber(hass, entities.solar_capacity);
  if (parsed === null) return null;
  const unit = unitOf(hass, entities.solar_capacity);
  if (unit === "w" || unit === "watts") return parsed;
  if (unit === "kw" || unit === "kilowatts") return parsed * 1000;
  return parsed <= 100 ? parsed * 1000 : parsed;
}

function batteryCapacityKwh(config, hass, entities) {
  const configured = parseNumber(config.battery_capacity_kwh);
  if (configured !== null) return configured;
  const parsed = stateNumber(hass, entities.battery_capacity);
  if (parsed === null) return null;
  return unitOf(hass, entities.battery_capacity) === "wh" ? parsed / 1000 : parsed;
}

function formatSolarEfficiency(solarWatts, capacityWatts) {
  if (!capacityWatts || capacityWatts <= 0) return null;
  return `${Math.max(0, Math.round(((parseNumber(solarWatts) ?? 0) / capacityWatts) * 100))}%`;
}

function rateValue(config, hass, direction) {
  const tariffs = config.tariffs || {};
  return stateNumber(hass, tariffs[`${direction}_rate_entity`]) ?? parseNumber(tariffs[`${direction}_rate`]);
}

function currencySymbol(config) {
  return config.tariffs?.currency || DEFAULT_CURRENCY;
}

function gridCostModel(config, hass, gridWatts) {
  const importing = gridWatts >= 0;
  const currency = currencySymbol(config);
  const importRate = rateValue(config, hass, "import");
  const exportRate = rateValue(config, hass, "export");
  const rate = importing ? importRate : exportRate;
  const hourly = rate === null ? null : (Math.abs(gridWatts) / 1000) * rate * (importing ? 1 : -1);
  return {
    watts: gridWatts,
    rate,
    importRate,
    exportRate,
    currency,
    status: importing ? "import cost" : "export credit",
    displayStatus: importing ? "Import cost" : "Export credit",
    valueLabel: hourly === null ? "-" : `${formatMoney(hourly, currency)}/h`,
  };
}

// ---------------------------------------------------------------------------
// Bottom bar cards
// ---------------------------------------------------------------------------

const BOTTOM_CARD_OPTIONS = [
  { value: "cost_today", label: "Cost today" },
  { value: "cost_now", label: "Grid cost now" },
  { value: "tariff_now", label: "Tariff now" },
  { value: "self_powered_today", label: "Self powered today" },
  { value: "grid_import_export", label: "Grid import / export today" },
  { value: "home_today", label: "Home used today" },
  { value: "solar_today", label: "Solar generated today", system: "solar" },
  { value: "ev_today", label: "EV charged today", system: "ev" },
  { value: "battery_reserve", label: "Battery reserve", system: "battery" },
  { value: "battery_charge", label: "Battery charged today", system: "battery" },
  { value: "battery_discharge", label: "Battery discharged today", system: "battery" },
  { value: "sun", label: "Sunrise / sunset" },
  { value: "weather", label: "Weather" },
  { value: "entity", label: "Custom entity" },
];

const LEGACY_BOTTOM_TYPES = {
  cost: "cost_now",
  current_cost: "cost_now",
  budget: "cost_today",
  self_powered: "self_powered_today",
  grid_energy: "grid_import_export",
};

const BOTTOM_CARD_SYSTEM = Object.fromEntries(
  BOTTOM_CARD_OPTIONS.filter((option) => option.system).map((option) => [option.value, option.system]),
);
BOTTOM_CARD_SYSTEM.solar = "solar";
BOTTOM_CARD_SYSTEM.ev = "ev";
BOTTOM_CARD_SYSTEM.battery = "battery";

function energyTodayEntity(config, key, fallbackGroup, fallbackKey) {
  const energyToday = config.energy_today || {};
  return energyToday[key] || config.detail_entities?.[fallbackGroup]?.[fallbackKey];
}

function energyTodayNumber(config, hass, key, fallbackGroup, fallbackKey) {
  return stateNumber(hass, energyTodayEntity(config, key, fallbackGroup, fallbackKey));
}

function energyTodayCard(kind, config, hass, { entityKey, fallbackGroup, fallbackKey, label, status, icon, color, detailKind }) {
  const entity = energyTodayEntity(config, entityKey, fallbackGroup, fallbackKey);
  return {
    kind,
    label,
    status,
    value: formatEnergy(stateValue(hass, entity)),
    icon,
    color,
    detailKind,
    entityId: entity,
    available: Boolean(entity),
  };
}

function costTodayCard(config, hass) {
  const costs = config.costs || {};
  const entity = costs.today_entity;
  const currency = currencySymbol(config);
  const value = stateNumber(hass, entity);
  const budget = parseNumber(costs.daily_budget);
  return {
    kind: "cost_today",
    label: "Cost today",
    status: budget ? `of ${formatMoney(budget, currency)} budget` : "Today",
    value: formatMoney(value, currency),
    progress: progressPercent(value, budget),
    icon: ICONS.cost,
    color: COLORS.cost,
    detailKind: "grid",
    entityId: entity,
    available: Boolean(entity),
  };
}

function costNowCard(model) {
  return {
    kind: "cost",
    label: "Grid cost",
    status: model.cost.displayStatus,
    value: model.cost.valueLabel,
    icon: ICONS.cost,
    color: model.cost.watts >= 0 ? COLORS.cost : COLORS.export,
    detailKind: "grid",
    available: model.cost.importRate !== null || model.cost.exportRate !== null,
  };
}

function tariffNowCard(model) {
  const { importRate, exportRate, currency } = model.cost;
  const hasExport = exportRate !== null;
  return {
    kind: "tariff_now",
    label: "Tariff",
    status: hasExport ? `Export ${formatRate(exportRate, currency)}` : "Import rate",
    value: importRate === null ? "-" : formatRate(importRate, currency),
    icon: ICONS.tariff,
    color: COLORS.cost,
    detailKind: "grid",
    available: importRate !== null,
  };
}

function selfPoweredTodayCard(config, hass) {
  const home = energyTodayNumber(config, hass, "home", "house", "energy_24h");
  let imported = energyTodayNumber(config, hass, "grid_import", "grid", "import_24h");
  if (imported === null) imported = Math.max(0, energyTodayNumber(config, hass, "grid", "grid", "import_24h") ?? 0);
  const percent = home && home > 0 ? Math.max(0, Math.min(100, Math.round(((home - imported) / home) * 100))) : null;
  return {
    kind: "self_powered_today",
    label: "Self powered",
    status: "Today",
    value: percent === null ? "-" : `${percent}%`,
    progress: percent,
    icon: ICONS.selfPowered,
    color: COLORS.selfPowered,
    detailKind: "house",
    available: percent !== null,
  };
}

function gridImportExportCard(config, hass) {
  const imported = energyTodayNumber(config, hass, "grid_import", "grid", "import_24h");
  const exported = energyTodayNumber(config, hass, "grid_export", "grid", "export_24h");
  const total = (imported ?? 0) + (exported ?? 0);
  return {
    kind: "grid_import_export",
    label: "Grid today",
    status: "Import / export",
    value: `${formatEnergy(imported).replace(" kWh", "")} / ${formatEnergy(exported)}`,
    progress: imported !== null && exported !== null && total > 0 ? Math.round((exported / total) * 100) : null,
    icon: ICONS.grid,
    color: COLORS.grid,
    detailKind: "grid",
    available: imported !== null || exported !== null,
  };
}

function batteryReserveCard(model) {
  const capacity = parseNumber(model.battery.capacityLabel);
  const soc = parseNumber(model.battery.socLabel);
  const loadKw = Math.max(0, (parseNumber(model.house.watts) ?? 0) / 1000);
  const remaining = capacity !== null && soc !== null ? capacity * (soc / 100) : null;
  const reserveHours = remaining !== null && loadKw > 0.025 ? remaining / loadKw : null;
  return {
    kind: "battery_reserve",
    label: "Battery reserve",
    status: "At current load",
    value: formatHours(reserveHours),
    progress: soc,
    icon: ICONS.batteryReserve,
    color: COLORS.battery,
    detailKind: "battery",
    available: remaining !== null,
  };
}

function weatherCard(config, hass) {
  const entity = config.entities?.weather;
  const temperatureEntity = config.entities?.outdoor_temperature;
  const attrs = stateAttributes(hass, entity);
  const temperature = temperatureEntity ? stateValue(hass, temperatureEntity) : attrs.temperature;
  const unit = temperatureEntity ? stateAttributes(hass, temperatureEntity).unit_of_measurement : attrs.temperature_unit;
  return {
    kind: "weather",
    label: "Weather",
    status: weatherStateLabel(stateValue(hass, entity)),
    value: formatTemperature(temperature, unit),
    icon: ICONS.weather,
    color: COLORS.weather,
    entityId: entity || temperatureEntity,
    available: Boolean(entity || temperatureEntity),
  };
}

function weatherStateLabel(value) {
  const raw = String(value || "unknown").toLowerCase();
  const labels = {
    "clear-night": "Clear night",
    cloudy: "Cloudy",
    fog: "Fog",
    hail: "Hail",
    lightning: "Lightning",
    "lightning-rainy": "Lightning and rain",
    partlycloudy: "Partly cloudy",
    pouring: "Pouring",
    rainy: "Rainy",
    snowy: "Snowy",
    "snowy-rainy": "Sleet",
    sunny: "Sunny",
    windy: "Windy",
    "windy-variant": "Windy",
    unknown: "",
  };
  return labels[raw] ?? titleCaseLabel(raw.replace(/[-_]/g, " "));
}

function sunCard(config, hass) {
  const entityId = config.entities?.sun || "sun.sun";
  const state = String(stateValue(hass, entityId)).toLowerCase();
  const attrs = stateAttributes(hass, entityId);
  const isDay = state === "above_horizon";
  return {
    kind: "sun",
    label: isDay ? "Sunset" : "Sunrise",
    status: isDay ? "Today" : "Tomorrow",
    value: formatEventTime(isDay ? attrs.next_setting : attrs.next_rising),
    icon: ICONS.sun,
    color: COLORS.sun,
    entityId,
    available: state === "above_horizon" || state === "below_horizon",
  };
}

function nodePowerCard(kind, node, icon, color) {
  return { kind, label: node.cardLabel || node.label, status: node.displayStatus, value: node.pillValue || node.powerLabel, icon, color, available: true };
}

function predefinedBottomCard(type, model, config, hass) {
  const normalisedType = LEGACY_BOTTOM_TYPES[type] || type;
  const system = BOTTOM_CARD_SYSTEM[normalisedType];
  if (system && !model.visible[system]) return null;

  switch (normalisedType) {
    case "cost_today":
      return costTodayCard(config, hass);
    case "cost_now":
      return costNowCard(model);
    case "tariff_now":
      return tariffNowCard(model);
    case "self_powered_today":
      return selfPoweredTodayCard(config, hass);
    case "grid_import_export":
      return gridImportExportCard(config, hass);
    case "home_today":
      return energyTodayCard("home_today", config, hass, { entityKey: "home", fallbackGroup: "house", fallbackKey: "energy_24h", label: "Home today", status: "Used", icon: ICONS.houseToday, color: COLORS.house, detailKind: "house" });
    case "solar_today":
      return energyTodayCard("solar_today", config, hass, { entityKey: "solar", fallbackGroup: "solar", fallbackKey: "energy_24h", label: "Solar today", status: "Generated", icon: ICONS.solarToday, color: COLORS.solar, detailKind: "solar" });
    case "ev_today":
      return energyTodayCard("ev_today", config, hass, { entityKey: "ev", fallbackGroup: "ev", fallbackKey: "energy_24h", label: "EV today", status: "Charged", icon: ICONS.evToday, color: COLORS.ev, detailKind: "ev" });
    case "battery_reserve":
      return batteryReserveCard(model);
    case "battery_charge":
      return energyTodayCard("battery_charge", config, hass, { entityKey: "battery_charge", fallbackGroup: "battery", fallbackKey: "charge_24h", label: "Battery charged", status: "Today", icon: ICONS.batteryCharge, color: COLORS.battery, detailKind: "battery" });
    case "battery_discharge":
      return energyTodayCard("battery_discharge", config, hass, { entityKey: "battery_discharge", fallbackGroup: "battery", fallbackKey: "discharge_24h", label: "Battery discharged", status: "Today", icon: ICONS.batteryDischarge, color: COLORS.discharge, detailKind: "battery" });
    case "sun":
      return sunCard(config, hass);
    case "weather":
      return weatherCard(config, hass);
    case "grid":
      return { ...nodePowerCard("grid", model.grid, ICONS.grid, COLORS.grid), value: model.grid.powerLabel };
    case "solar":
      return nodePowerCard("solar", model.solar, ICONS.solar, COLORS.solar);
    case "house":
      return { ...nodePowerCard("house", model.house, ICONS.house, COLORS.house), value: model.house.powerLabel };
    case "ev":
      return nodePowerCard("ev", model.ev, ICONS.ev, COLORS.ev);
    case "battery":
      return nodePowerCard("battery", model.battery, ICONS.battery, COLORS.battery);
    default:
      return null;
  }
}

function customBottomCard(item, config, hass, model) {
  const type = typeof item === "string" ? item : item?.type;
  if (!type || type === "none") return null;
  if (type === "entity") {
    if (typeof item !== "object" || !item.entity) return null;
    return {
      kind: "entity",
      label: item.label || entityName(hass, item.entity),
      status: item.status || "",
      value: entityDisplayValue(hass, item.entity),
      icon: item.icon || ICONS.entity,
      color: item.color || COLORS.entity,
      entityId: item.entity,
    };
  }
  const card = predefinedBottomCard(type, model, config, hass);
  if (!card) return null;
  if (typeof item !== "object") return card;
  return {
    ...card,
    label: item.label || card.label,
    status: item.status || card.status,
    icon: item.icon || card.icon,
    color: item.color || card.color,
    detailKind: item.detail_kind || card.detailKind,
  };
}

function configuredBottomBar(config) {
  return Array.isArray(config.bottom_bar) ? config.bottom_bar : null;
}

// With no bottom_bar configured, show the glance cards that actually have data.
const DEFAULT_BOTTOM_ORDER = ["cost_today", "self_powered_today", "grid_import_export", "battery_reserve", "solar_today", "cost_now", "ev_today", "home_today", "sun"];

function buildBottomCards(config, hass, model) {
  const configured = configuredBottomBar(config);
  if (configured?.length) {
    return configured.map((item) => customBottomCard(item, config, hass, model)).filter(Boolean).slice(0, MAX_BOTTOM_CARDS);
  }
  const cards = DEFAULT_BOTTOM_ORDER.map((type) => predefinedBottomCard(type, model, config, hass)).filter((card) => card?.available);
  if (cards.length < 3 && !cards.some((card) => card.kind === "sun")) {
    const sun = sunCard(config, hass);
    if (sun.available) cards.push(sun);
  }
  return cards.slice(0, MAX_BOTTOM_CARDS);
}

// ---------------------------------------------------------------------------
// Detail panels and actions
// ---------------------------------------------------------------------------

const DETAIL_CONTROL_DOMAINS = new Set(["button", "input_button", "lock", "switch"]);

function detailRow(label, value, entityId) {
  if (!value || value === "-") return null;
  return { label, value, entityId };
}

function normaliseAction(action) {
  if (!action || typeof action !== "object" || !action.service) return null;
  const [domain, serviceName] = String(action.service).split(".");
  if (!domain || !serviceName) return null;
  return {
    label: action.label || titleCaseLabel(serviceName.replace(/_/g, " ")),
    icon: action.icon || "mdi:gesture-tap-button",
    service: action.service,
    domain,
    serviceName,
    target: action.target || {},
    data: action.data || action.service_data || {},
    entityId: action.entity || action.entity_id || action.target?.entity_id,
    stateLabel: action.state_label,
    tone: action.tone || "neutral",
  };
}

function normaliseDetailEntry(key, value) {
  if (typeof value === "string") return { key, entity: value, auto: true };
  if (!value || typeof value !== "object") return null;
  return { ...value, key: value.key || key, entity: value.entity || value.entity_id };
}

function detailEntityEntries(config, group) {
  const entries = config.detail_entities?.[group] || {};
  if (Array.isArray(entries)) {
    return entries
      .map((entry, index) => {
        if (typeof entry === "string") return { key: entry.split(".").pop(), entity: entry, auto: true, listed: true };
        return normaliseDetailEntry(entry?.key || entry?.name || entry?.label || `item_${index + 1}`, entry);
      })
      .filter(Boolean);
  }
  return Object.entries(entries).map(([key, value]) => normaliseDetailEntry(key, value)).filter(Boolean);
}

function isControlDetailEntry(entry) {
  if (entry?.service) return true;
  return DETAIL_CONTROL_DOMAINS.has(entityDomain(entry?.entity)) && entry?.display !== "row";
}

function detailControlAction(entry, hass) {
  if (entry?.service) return normaliseAction(entry);
  const entityId = entry?.entity;
  const domain = entityDomain(entityId);
  const state = String(stateValue(hass, entityId)).toLowerCase();
  const target = { entity_id: entityId };
  const baseLabel = entry?.label || entityName(hass, entityId, labelFromDetailKey(entry?.key));

  if (domain === "lock") {
    const locked = state === "locked";
    return {
      label: entry?.label || (locked ? "Unlock" : "Lock"),
      icon: entry?.icon || (locked ? "mdi:lock" : "mdi:lock-open-variant"),
      service: locked ? "lock.unlock" : "lock.lock",
      domain: "lock",
      serviceName: locked ? "unlock" : "lock",
      target,
      data: {},
      entityId,
      stateLabel: titleCaseLabel(state || "unknown"),
      tone: locked ? "secure" : "alert",
    };
  }

  if (domain === "switch") {
    return {
      label: baseLabel,
      icon: entry?.icon || (state === "on" ? "mdi:toggle-switch" : "mdi:toggle-switch-off-outline"),
      service: "switch.toggle",
      domain: "switch",
      serviceName: "toggle",
      target,
      data: {},
      entityId,
      stateLabel: titleCaseLabel(state || "unknown"),
      tone: state === "on" ? "on" : "off",
    };
  }

  if (domain === "button" || domain === "input_button") {
    return {
      label: baseLabel,
      icon: entry?.icon || "mdi:gesture-tap-button",
      service: `${domain}.press`,
      domain,
      serviceName: "press",
      target,
      data: {},
      entityId,
      stateLabel: entry?.state_label,
      tone: "neutral",
    };
  }

  return null;
}

function buildActions(config, hass) {
  const actions = config.actions || {};
  return Object.fromEntries(
    SYSTEM_GROUPS.map((key) => [
      key,
      [
        ...detailEntityEntries(config, key).filter(isControlDetailEntry).map((entry) => detailControlAction(entry, hass)).filter(Boolean),
        ...(Array.isArray(actions[key]) ? actions[key] : []).map(normaliseAction).filter(Boolean),
      ],
    ]),
  );
}

function detailEntityDisplayValue(hass, entry) {
  const key = String(entry?.key || entry?.label || "").toLowerCase();
  if (!key.includes("odometer")) return entityDisplayValue(hass, entry.entity);
  const parsed = stateNumber(hass, entry.entity);
  if (parsed === null) return entityDisplayValue(hass, entry.entity);
  const unit = stateAttributes(hass, entry.entity).unit_of_measurement;
  return unit ? `${Math.round(parsed)} ${unit}` : String(Math.round(parsed));
}

function configuredDetailRows(config, hass, group) {
  return detailEntityEntries(config, group)
    .filter((entry) => !isControlDetailEntry(entry))
    .map((entry) => {
      const label = entry.label || (entry.listed ? entityName(hass, entry.entity) : labelFromDetailKey(entry.key));
      return detailRow(label, detailEntityDisplayValue(hass, entry), entry.entity);
    })
    .filter(Boolean);
}

function buildDetailGroups(config, hass, model) {
  const energyToday = config.energy_today || {};
  return {
    grid: [
      detailRow("Grid power", model.grid.powerLabel, model.entities.grid_power),
      detailRow("Status", model.grid.displayStatus),
      detailRow("Current cost", model.cost.valueLabel),
      detailRow(model.cost.rate === null ? null : `${model.cost.displayStatus} rate`, model.cost.rate === null ? null : formatRate(model.cost.rate, model.cost.currency)),
      detailRow("Energy today", model.energyToday.grid, energyToday.grid),
      detailRow("Imported today", model.energyToday.gridImport, energyToday.grid_import),
      detailRow("Exported today", model.energyToday.gridExport, energyToday.grid_export),
      ...configuredDetailRows(config, hass, "grid"),
    ].filter(Boolean),
    solar: [
      detailRow("Solar power", model.solar.powerLabel, model.entities.solar_power),
      detailRow("Efficiency", model.solar.efficiencyLabel),
      detailRow("Generated today", model.energyToday.solar, energyToday.solar),
      ...configuredDetailRows(config, hass, "solar"),
    ].filter(Boolean),
    house: [
      detailRow("Home usage", model.house.powerLabel, model.entities.house_power),
      detailRow("Used today", model.energyToday.home, energyToday.home),
      ...configuredDetailRows(config, hass, "house"),
    ].filter(Boolean),
    ev: [
      detailRow("Charge power", model.ev.powerLabel, model.entities.ev_power),
      detailRow("State of charge", model.ev.socLabel, model.entities.ev_soc),
      detailRow("Charging state", model.ev.displayStatus, model.entities.ev_charging_state),
      detailRow("Charged today", model.energyToday.ev, energyToday.ev),
      ...configuredDetailRows(config, hass, "ev"),
    ].filter(Boolean),
    battery: [
      detailRow("Battery power", model.battery.powerLabel, model.entities.battery_power),
      detailRow("State of charge", model.battery.socLabel, model.entities.battery_soc),
      detailRow("Capacity", model.battery.capacityLabel, model.entities.battery_capacity),
      detailRow("Charged today", model.energyToday.batteryCharge, energyToday.battery_charge),
      detailRow("Discharged today", model.energyToday.batteryDischarge, energyToday.battery_discharge),
      ...configuredDetailRows(config, hass, "battery"),
    ].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// Visibility, time of day, backgrounds
// ---------------------------------------------------------------------------

export function entityEnabled(value, hass, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const raw = String(value).trim();
  if (!raw) return fallback;
  if (raw.includes(".")) {
    const entityState = stateValue(hass, raw);
    return ["on", "true", "home", "charging", "plugged_in", "connected", "open"].includes(String(entityState).toLowerCase());
  }
  return ["on", "true", "yes", "1", "enabled", "show"].includes(raw.toLowerCase());
}

export function timeOfDay(config = {}, hass, now = new Date()) {
  const configured = config.time_of_day;
  if (configured) {
    if (typeof configured === "string" && configured.includes(".")) {
      const value = String(stateValue(hass, configured)).toLowerCase();
      if (["above_horizon", "day", "sunny", "on", "true"].includes(value)) return "day";
      if (["below_horizon", "night", "off", "false"].includes(value)) return "night";
    }
    const raw = String(configured).toLowerCase();
    if (raw === "day" || raw === "night") return raw;
  }

  const sunState = String(stateValue(hass, config.entities?.sun || "sun.sun")).toLowerCase();
  if (sunState === "above_horizon") return "day";
  if (sunState === "below_horizon") return "night";

  const hour = now.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "day" : "night";
}

export function setupBackgroundKey(visible) {
  const { ev, solar, battery } = visible;
  if (ev && solar && battery) return "full";
  if (ev && solar) return "ev_solar";
  if (ev && battery) return "ev_battery";
  if (solar && battery) return "solar_battery";
  if (ev) return "ev_only";
  if (solar) return "solar_only";
  if (battery) return "battery_only";
  return "base";
}

function readBackgroundCandidate(entry, mode) {
  if (!entry) return null;
  if (typeof entry === "string") return { url: entry, fallback: null };
  const modeEntry = entry[mode];
  if (modeEntry && typeof modeEntry === "object") return { url: modeEntry.default || null, fallback: modeEntry.fallback || null };
  return { url: modeEntry || entry.default || null, fallback: entry.fallback || null };
}

function selectBackgroundCandidate(config = {}, visible = {}, mode = "night") {
  const setupKey = setupBackgroundKey(visible);
  const keys = BACKGROUND_ALIASES[setupKey] || [setupKey];

  if (config.backgrounds) {
    for (const key of keys) {
      const value = readBackgroundCandidate(config.backgrounds[key], mode);
      if (value?.url) return value;
    }
  }
  if (setupKey === "solar_battery" && config.background_no_ev) return { url: config.background_no_ev, fallback: null };
  if (setupKey === "full" && config.background_full) return { url: config.background_full, fallback: null };

  return readBackgroundCandidate(DEFAULT_BACKGROUNDS[setupKey], mode);
}

export function selectBackground(config = {}, visible = {}, mode = "night") {
  return selectBackgroundCandidate(config, visible, mode).url;
}

// ---------------------------------------------------------------------------
// Energy model
// ---------------------------------------------------------------------------

function statusFromPower(value, positiveStatus, negativeStatus, idleStatus = "idle") {
  const watts = parseNumber(value) ?? 0;
  if (watts > ACTIVE_THRESHOLD_W) return positiveStatus;
  if (watts < -ACTIVE_THRESHOLD_W) return negativeStatus;
  return idleStatus;
}

function nodeModel({ label, cardLabel, watts, status, tone, extras = [], nodeExtra, configured = true, ...rest }) {
  const displayStatus = sentenceCase(status);
  const active = tone !== "idle";
  return {
    label,
    cardLabel: cardLabel || label,
    watts,
    powerLabel: configured ? formatPower(watts) : "-",
    status,
    displayStatus,
    statusLabel: joinLabels([displayStatus, ...extras]),
    pillValue: joinLabels([formatPower(watts), ...extras]),
    tone,
    toneColor: TONE_COLORS[tone] || TONE_COLORS.idle,
    active,
    nodeExtra,
    ...rest,
  };
}

export function buildEnergyModel(config = {}, hass) {
  const entities = config.entities || {};
  const energyToday = config.energy_today || {};
  const visible = {
    ev: entityEnabled(config.show_ev, hass, false),
    solar: entityEnabled(config.show_solar, hass, true),
    battery: entityEnabled(config.show_battery, hass, true),
  };

  const gridWatts = stateNumber(hass, entities.grid_power) ?? 0;
  const solarWatts = stateNumber(hass, entities.solar_power) ?? 0;
  const houseWatts = stateNumber(hass, entities.house_power) ?? 0;
  const evWatts = stateNumber(hass, entities.ev_power) ?? 0;
  const batteryWatts = stateNumber(hass, entities.battery_power) ?? 0;
  const batteryCapacity = batteryCapacityKwh(config, hass, entities);
  const solarEfficiency = formatSolarEfficiency(solarWatts, solarCapacityWatts(config, hass, entities));
  const mode = timeOfDay(config, hass, config.now ? new Date(config.now) : new Date());
  const labels = configLabels(config);

  const gridStatus = statusFromPower(gridWatts, "importing", "exporting");
  const solarStatus = solarWatts > ACTIVE_THRESHOLD_W ? "producing" : "idle";
  const evStatus = normaliseStateLabel(stateValue(hass, entities.ev_charging_state), statusFromPower(evWatts, "charging", "discharging", "plugged in"));
  const evTone = evStatus === "charging" ? "charging" : evStatus === "discharging" ? "discharging" : "idle";
  const batteryStatus = statusFromPower(batteryWatts, "charging", "discharging");
  const evSoc = optionalPercent(stateValue(hass, entities.ev_soc));
  const batterySocLabel = formatPercent(stateValue(hass, entities.battery_soc));
  const background = selectBackgroundCandidate(config, visible, mode);

  const model = {
    mode,
    entities,
    visible,
    labels,
    setupComplete: Boolean(entities.grid_power && entities.house_power),
    background: background.url,
    backgroundFallback: background.fallback,
    showStatusBar: entityEnabled(config.show_bottom_bar, hass, true),
    size: cardSizeModel(config),
    cost: gridCostModel(config, hass, gridWatts),
    actions: buildActions(config, hass),
    grid: nodeModel({
      label: labels.grid,
      cardLabel: labels.gridCard,
      watts: gridWatts,
      configured: Boolean(entities.grid_power),
      status: gridStatus,
      tone: gridStatus === "importing" ? "import" : gridStatus === "exporting" ? "export" : "idle",
      nodeExtra: nodeExtraLabel(config, hass, "grid"),
    }),
    solar: nodeModel({
      label: labels.solar,
      watts: solarWatts,
      configured: Boolean(entities.solar_power),
      status: solarStatus,
      tone: solarStatus === "producing" ? "producing" : "idle",
      extras: [solarStatus === "producing" ? solarEfficiency : null],
      nodeExtra: nodeExtraLabel(config, hass, "solar"),
      efficiencyLabel: solarEfficiency,
    }),
    house: nodeModel({
      label: labels.house,
      watts: houseWatts,
      configured: Boolean(entities.house_power),
      status: "consuming",
      tone: houseWatts > ACTIVE_THRESHOLD_W ? "consuming" : "idle",
      nodeExtra: nodeExtraLabel(config, hass, "house"),
    }),
    ev: nodeModel({
      label: labels.ev,
      cardLabel: labels.evCard,
      watts: evWatts,
      configured: Boolean(entities.ev_power),
      status: evStatus,
      tone: evTone,
      extras: [evSoc],
      nodeExtra: nodeExtraLabel(config, hass, "ev"),
      socLabel: evSoc || "-",
    }),
    battery: nodeModel({
      label: labels.battery,
      watts: batteryWatts,
      configured: Boolean(entities.battery_power),
      status: batteryStatus,
      tone: batteryStatus,
      extras: [batterySocLabel],
      nodeExtra: nodeExtraLabel(config, hass, "battery"),
      socLabel: batterySocLabel,
      capacityLabel: formatBatteryCapacity(batteryCapacity),
    }),
    energyToday: {
      grid: formatEnergy(stateValue(hass, energyToday.grid)),
      gridImport: formatEnergy(stateValue(hass, energyToday.grid_import)),
      gridExport: formatEnergy(stateValue(hass, energyToday.grid_export)),
      solar: formatEnergy(stateValue(hass, energyToday.solar)),
      home: formatEnergy(stateValue(hass, energyToday.home)),
      ev: formatEnergy(stateValue(hass, energyToday.ev)),
      batteryCharge: formatEnergy(stateValue(hass, energyToday.battery_charge)),
      batteryDischarge: formatEnergy(stateValue(hass, energyToday.battery_discharge)),
    },
  };
  model.details = buildDetailGroups(config, hass, model);
  model.bottomCards = buildBottomCards(config, hass, model);
  return model;
}

function fireEvent(node, type, detail, options = {}) {
  node.dispatchEvent(
    new CustomEvent(type, {
      bubbles: options.bubbles ?? true,
      cancelable: options.cancelable ?? false,
      composed: options.composed ?? true,
      detail,
    }),
  );
}

// ---------------------------------------------------------------------------
// Card element
// ---------------------------------------------------------------------------

class HacsHomeEnergyCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _activeDetail: { state: true },
    _outgoingScene: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      width: min(100%, var(--energy-card-width, 100%));
      min-width: min(100%, var(--energy-card-min-width, 320px));
      max-width: 100%;
      color: var(--energy-card-text, #f7fbff);
      --energy-card-accent: #58d5ff;
      --energy-card-radius: 8px;
      --energy-card-aspect-ratio: 1672 / 941;
      --energy-card-padding: clamp(12px, 3cqw, 34px);
      --energy-card-glass: rgba(4, 12, 18, .52);
      --energy-card-glass-strong: rgba(5, 14, 20, .68);
      --energy-card-border: rgba(220, 242, 255, .2);
      --energy-card-muted: rgba(232, 245, 255, .72);
      --energy-card-shadow: 0 24px 70px rgba(0, 0, 0, .46);
      --energy-card-ease: cubic-bezier(.2, .7, .2, 1);
      font-family: var(--energy-card-font-family, var(--paper-font-body1_-_font-family, Inter, Roboto, sans-serif));
    }

    ha-card {
      display: block;
      position: relative;
      overflow: hidden;
      width: 100%;
      height: var(--energy-card-height, auto);
      min-height: var(--energy-card-min-height, 180px);
      aspect-ratio: var(--energy-card-aspect-ratio);
      container-type: inline-size;
      border-radius: var(--energy-card-radius);
      border: 1px solid var(--energy-card-border);
      background: #071015;
      box-shadow: var(--energy-card-shadow);
    }

    button {
      appearance: none;
      font: inherit;
      color: inherit;
      text-align: left;
    }

    button:focus-visible {
      outline: 2px solid var(--energy-card-accent);
      outline-offset: 2px;
    }

    /* Scene layers. Two can exist briefly while a day/night or setup change crossfades. */
    .scene {
      position: absolute;
      inset: 0;
      background-image: var(--energy-background), var(--energy-background-fallback, none);
      background-position: center;
      background-size: 100% 100%;
      filter: saturate(1.08) contrast(1.06);
    }

    .scene::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(0, 0, 0, .58), rgba(0, 0, 0, .18) 48%, rgba(0, 0, 0, .42)),
        linear-gradient(180deg, rgba(0, 0, 0, .28), rgba(0, 0, 0, .06) 42%, rgba(0, 0, 0, .68)),
        linear-gradient(100deg, rgba(23, 185, 255, .08), transparent 34%),
        radial-gradient(circle at 78% 18%, rgba(255, 209, 90, .16), transparent 28%);
    }

    .scene.mode-day {
      filter: saturate(1.02) contrast(1.02);
    }

    .scene.mode-day::after {
      background:
        linear-gradient(90deg, rgba(0, 0, 0, .30), rgba(0, 0, 0, .06) 48%, rgba(0, 0, 0, .24)),
        linear-gradient(180deg, rgba(0, 0, 0, .12), rgba(0, 0, 0, .02) 42%, rgba(0, 0, 0, .42)),
        linear-gradient(100deg, rgba(45, 156, 255, .05), transparent 34%),
        radial-gradient(circle at 76% 14%, rgba(255, 222, 145, .10), transparent 24%);
    }

    .scene.scene-incoming {
      animation: sceneFade 1.4s var(--energy-card-ease) both;
    }

    .content {
      position: absolute;
      inset: 0;
      z-index: 2;
      padding: var(--energy-card-padding);
      box-sizing: border-box;
    }

    .mid {
      position: absolute;
      inset: 0;
    }

    /* Floating nodes */
    .node {
      position: absolute;
      z-index: 2;
      display: grid;
      gap: 2px;
      min-width: 92px;
      padding: 7px 10px 8px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .18);
      background: var(--energy-card-glass);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, .28);
      cursor: pointer;
      --node-tone: rgba(255, 255, 255, .42);
      transition: transform .18s var(--energy-card-ease), border-color .18s ease, background .18s ease;
    }

    .node[data-active="true"] {
      border-color: color-mix(in srgb, var(--node-tone), rgba(255, 255, 255, .18) 55%);
      animation: nodeBreath 3.6s ease-in-out infinite;
    }

    .node:hover,
    .pill:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, .4);
      background: rgba(7, 22, 32, .74);
    }

    .node-label,
    .pill-label {
      color: var(--energy-card-muted);
      font-size: 10px;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    .pill-label {
      letter-spacing: .04em;
    }

    .node-value {
      font-size: clamp(16px, 2.1cqw, 24px);
      line-height: 1;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      text-shadow: 0 0 18px rgba(86, 213, 255, .24);
      white-space: nowrap;
    }

    .node-state,
    .node-extra {
      color: var(--energy-card-muted);
      font-size: 11px;
      line-height: 1.25;
      white-space: nowrap;
    }

    .node-state {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }

    .node-state::before {
      content: "";
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--node-tone);
      box-shadow: 0 0 8px var(--node-tone);
    }

    .node-solar { top: 31%; left: 52%; color: #fff2bc; }
    .node-grid { top: 42%; left: 2%; color: #d9f2ff; }
    .node-house { top: 47%; left: 42%; color: #ffffff; }
    .node-ev { right: 3%; bottom: 26%; color: #d9fbff; }
    .node-battery { top: 58%; left: 65%; color: #dbfff6; }

    /* First run hint */
    .setup-hint {
      position: absolute;
      left: 50%;
      top: 44%;
      z-index: 4;
      width: min(380px, 80%);
      padding: 16px 18px;
      transform: translate(-50%, -50%);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, .22);
      background: var(--energy-card-glass-strong);
      backdrop-filter: blur(16px);
      box-shadow: 0 18px 50px rgba(0, 0, 0, .4);
      animation: hintRise .3s var(--energy-card-ease) both;
    }

    .setup-hint-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }

    .setup-hint-body {
      margin-top: 4px;
      color: var(--energy-card-muted);
      font-size: 13px;
      line-height: 1.4;
    }

    /* Bottom glance bar */
    .statusbar {
      position: absolute;
      left: var(--energy-card-padding);
      right: var(--energy-card-padding);
      bottom: var(--energy-card-padding);
      z-index: 3;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
      gap: clamp(8px, 1.6cqw, 16px);
    }

    .pill {
      min-width: 0;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      padding: 10px 12px 10px 11px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .17);
      background: var(--energy-card-glass-strong);
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, .28);
      cursor: pointer;
      transition: transform .18s var(--energy-card-ease), border-color .18s ease, background .18s ease;
    }

    .pill ha-icon {
      width: 22px;
      height: 22px;
      color: var(--pill-color, var(--energy-card-accent));
      filter: drop-shadow(0 0 12px color-mix(in srgb, var(--pill-color, #58d5ff), transparent 35%));
    }

    .pill-body {
      display: grid;
      gap: 1px;
      min-width: 0;
    }

    .pill-label,
    .pill-value,
    .pill-status {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pill-value {
      margin-top: 2px;
      color: #ffffff;
      font-size: clamp(14px, 1.7cqw, 19px);
      line-height: 1.1;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .pill-status {
      color: var(--energy-card-muted);
      font-size: clamp(11px, 1.2cqw, 12px);
      line-height: 1.3;
    }

    .pill-progress {
      display: block;
      height: 3px;
      margin-top: 7px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(255, 255, 255, .16);
    }

    .pill-progress span {
      display: block;
      width: var(--pill-progress, 0%);
      height: 100%;
      border-radius: inherit;
      background: var(--pill-color, var(--energy-card-accent));
      box-shadow: 0 0 12px color-mix(in srgb, var(--pill-color, #58d5ff), transparent 30%);
      transition: width .6s var(--energy-card-ease);
    }

    /* Detail panel */
    .detail-backdrop {
      position: absolute;
      inset: 0;
      z-index: 8;
      display: grid;
      place-items: center;
      padding: var(--energy-card-padding);
      background: rgba(0, 0, 0, .28);
      backdrop-filter: blur(2px);
      animation: detailFade .16s ease both;
    }

    .detail-panel {
      width: min(430px, 100%);
      max-height: calc(100% - (var(--energy-card-padding) * 2));
      overflow: auto;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .22);
      background: rgba(5, 15, 22, .88);
      box-shadow: 0 24px 80px rgba(0, 0, 0, .52), inset 0 1px 0 rgba(255, 255, 255, .08);
      backdrop-filter: blur(20px);
      animation: detailRise .22s var(--energy-card-ease) both;
      color: var(--energy-card-text, #f7fbff);
    }

    .detail-head {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: start;
      padding: 18px 18px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, .10);
    }

    .detail-label {
      color: var(--energy-card-muted);
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .detail-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 4px;
      color: #ffffff;
      font-size: 22px;
      line-height: 1;
      font-weight: 700;
    }

    .detail-title ha-icon,
    .detail-action ha-icon {
      width: 22px;
      height: 22px;
      color: var(--pill-color, var(--energy-card-accent));
      filter: drop-shadow(0 0 12px color-mix(in srgb, var(--pill-color, #58d5ff), transparent 35%));
    }

    .detail-close {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, .16);
      border-radius: 8px;
      background: rgba(255, 255, 255, .06);
      color: #ffffff;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
    }

    .detail-body {
      display: grid;
      padding: 8px 18px 18px;
    }

    .detail-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      align-items: baseline;
      padding: 10px 0;
      border: 0;
      border-bottom: 1px solid rgba(255, 255, 255, .08);
      background: transparent;
      cursor: default;
    }

    .detail-row.has-entity {
      cursor: pointer;
    }

    .detail-row.has-entity:hover .detail-row-label {
      color: #ffffff;
    }

    .detail-row:last-child {
      border-bottom: 0;
    }

    .detail-row-label {
      color: var(--energy-card-muted);
      font-size: 13px;
      transition: color .15s ease;
    }

    .detail-row-value {
      color: #ffffff;
      font-size: 15px;
      font-weight: 650;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .detail-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, .10);
    }

    .detail-action {
      display: inline-grid;
      justify-items: center;
      align-content: center;
      gap: 3px;
      width: 68px;
      min-height: 68px;
      padding: 8px 6px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, .16);
      background: rgba(255, 255, 255, .06);
      color: #ffffff;
      cursor: pointer;
      text-align: center;
      --pill-color: var(--action-color, var(--energy-card-accent));
    }

    .detail-action:hover {
      border-color: rgba(255, 255, 255, .34);
      background: rgba(255, 255, 255, .10);
    }

    .detail-action-label,
    .detail-action-state {
      max-width: 56px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .detail-action-label {
      color: #ffffff;
      font-size: 10px;
      font-weight: 650;
      line-height: 1.12;
    }

    .detail-action-state {
      color: var(--energy-card-muted);
      font-size: 9px;
      line-height: 1.1;
    }

    .detail-action.tone-secure,
    .detail-action.tone-on { --action-color: #56f0a8; }
    .detail-action.tone-alert { --action-color: #ff6b6b; }
    .detail-action.tone-off { --action-color: #ffb86b; }

    @keyframes sceneFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes nodeBreath {
      0%, 100% { box-shadow: 0 10px 24px rgba(0, 0, 0, .28), 0 0 0 0 color-mix(in srgb, var(--node-tone), transparent 100%); }
      50% { box-shadow: 0 10px 24px rgba(0, 0, 0, .28), 0 0 0 4px color-mix(in srgb, var(--node-tone), transparent 78%); }
    }

    @keyframes detailFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes detailRise {
      from { opacity: 0; transform: translateY(10px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes hintRise {
      from { opacity: 0; transform: translate(-50%, calc(-50% + 8px)); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .node,
      .scene,
      .detail-backdrop,
      .detail-panel,
      .setup-hint {
        animation: none;
      }

      .node,
      .pill,
      .pill-progress span {
        transition: none;
      }
    }

    /* Responsive: the card is a container, so every breakpoint reads the card width, not the viewport. */
    @container (max-width: 960px) {
      .pill { gap: 9px; padding: 9px 10px; }
      .pill ha-icon { width: 19px; height: 19px; }
    }

    @container (max-width: 760px) {
      .pill { gap: 8px; padding: 8px 10px; }
      .pill ha-icon { width: 18px; height: 18px; }
      .pill-status { display: none; }
      .pill-progress { margin-top: 5px; }
      .statusbar { grid-template-columns: repeat(auto-fit, minmax(min(112px, 100%), 1fr)); gap: 6px; }
    }

    @container (max-width: 620px) {
      .content { --energy-card-padding: 14px; }
      .node { min-width: 72px; padding: 5px 8px 6px; }
      .node-label { font-size: 8px; }
      .node-value { font-size: 15px; }
      .node-state, .node-extra { display: none; }
      .node-solar { top: 29%; left: 53%; }
      .node-grid { top: 42%; left: 4%; }
      .node-house { top: 47%; left: 40%; }
      .node-ev { right: 4%; bottom: 34%; }
      .node-battery { top: 60%; left: 62%; }
      .statusbar { grid-template-columns: repeat(auto-fit, minmax(min(84px, 100%), 1fr)); gap: 5px; }
      .pill { gap: 6px; padding: 6px 8px; }
      .pill ha-icon { width: 16px; height: 16px; }
      .pill-label { display: none; }
      .pill-value { margin-top: 0; font-size: 12px; }
      .setup-hint { padding: 12px 14px; }
      .setup-hint-title { font-size: 14px; }
      .setup-hint-body { font-size: 12px; }
    }

    @container (max-width: 420px) {
      .content { --energy-card-padding: 9px; }
      .node { min-width: 58px; padding: 4px 6px; }
      .node-label { font-size: 7px; }
      .node-value { font-size: 12px; }
      .node-solar { top: 26%; left: 52%; }
      .node-grid { top: 36%; left: 3%; }
      .node-house { top: 42%; left: 39%; }
      .node-ev { right: 3%; bottom: 40%; }
      .node-battery { top: 54%; left: 58%; }
      .statusbar { grid-template-columns: repeat(auto-fit, minmax(min(100px, 100%), 1fr)); gap: 4px; }
      .pill { gap: 4px; padding: 4px 6px; }
      .pill ha-icon { width: 13px; height: 13px; }
      .pill-value { font-size: 11px; }
      .pill-progress { display: none; }
    }
  `;

  static getConfigElement() {
    return document.createElement("hacs-home-energy-card-editor");
  }

  static getStubConfig(hass) {
    return stubConfigFor(hass);
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("hacs-home-energy-card requires a configuration object");
    this._config = config;
  }

  getCardSize() {
    return 7;
  }

  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  willUpdate(changed) {
    if (changed.has("hass") || changed.has("_config")) {
      this._model = this._config ? buildEnergyModel(this._config, this.hass) : null;
      this.trackScene(this._model);
    }
  }

  // Keep the previous scene under the new one for one crossfade when the background changes.
  trackScene(model) {
    if (!model) return;
    if (this._scene && this._scene.url !== model.background) {
      this._outgoingScene = this._scene;
      clearTimeout(this._sceneTimer);
      this._sceneTimer = setTimeout(() => {
        this._outgoingScene = null;
      }, SCENE_FADE_MS + 100);
    }
    this._scene = { url: model.background, fallback: model.backgroundFallback, mode: model.mode };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._sceneTimer);
  }

  render() {
    const model = this._model;
    if (!model) return html``;
    this.applySizing(model.size);

    return html`
      <ha-card class="mode-${model.mode}">
        ${this._outgoingScene ? this.renderScene(this._outgoingScene, "scene-outgoing") : html``}
        ${this.renderScene(this._scene, this._outgoingScene ? "scene-incoming" : "")}
        <div class="content">
          <div class="mid">${model.setupComplete ? this.renderNodes(model) : this.renderSetupHint()}</div>
          ${model.showStatusBar ? this.renderStatusbar(model) : html``}
          ${this.renderDetailPanel(model)}
        </div>
      </ha-card>
    `;
  }

  renderScene(scene, extraClass) {
    if (!scene) return html``;
    return html`
      <div
        class="scene mode-${scene.mode} ${extraClass}"
        style="--energy-background: url('${scene.url}'); --energy-background-fallback: ${scene.fallback ? `url('${scene.fallback}')` : "none"}"
      ></div>
    `;
  }

  applySizing(size) {
    const width = size?.width || "100%";
    this.style.width = width === "100%" ? "100%" : `min(100%, ${width})`;
    this.style.minWidth = `min(100%, ${size?.minWidth || `${MIN_CARD_WIDTH_PX}px`})`;
    this.style.maxWidth = "100%";
    this.style.setProperty("--energy-card-width", width);
    this.style.setProperty("--energy-card-min-width", size?.minWidth || `${MIN_CARD_WIDTH_PX}px`);
    this.style.setProperty("--energy-card-min-height", size?.minHeight || `${MIN_CARD_HEIGHT_PX}px`);
    if (size?.height) this.style.setProperty("--energy-card-height", size.height);
    else this.style.removeProperty("--energy-card-height");
  }

  renderNodes(model) {
    return html`
      ${model.visible.solar ? this.renderNode("solar", model.solar) : html``}
      ${this.renderNode("grid", model.grid)}
      ${this.renderNode("house", model.house)}
      ${model.visible.ev ? this.renderNode("ev", model.ev) : html``}
      ${model.visible.battery ? this.renderNode("battery", model.battery) : html``}
    `;
  }

  renderSetupHint() {
    return html`
      <div class="setup-hint" role="status">
        <div class="setup-hint-title">Choose your power sensors</div>
        <div class="setup-hint-body">
          Pick a grid power and a home power sensor in the card editor. Solar, battery and EV can be added after.
        </div>
      </div>
    `;
  }

  renderNode(kind, node) {
    return html`
      <button
        class="node node-${kind}"
        type="button"
        data-active=${node.active ? "true" : "false"}
        style="--node-tone:${node.toneColor}"
        @click=${() => this.openDetail(kind)}
        aria-label=${`${node.label} details`}
      >
        <span class="node-label">${node.label}</span>
        <span class="node-value">${node.powerLabel}</span>
        <span class="node-state">${node.statusLabel}</span>
        ${node.nodeExtra ? html`<span class="node-extra">${node.nodeExtra}</span>` : html``}
      </button>
    `;
  }

  renderStatusbar(model) {
    if (!model.bottomCards.length) return html``;
    return html`<div class="statusbar">${model.bottomCards.map((card) => this.renderPill(card))}</div>`;
  }

  renderPill(card) {
    const hasProgress = card.progress !== null && card.progress !== undefined;
    return html`
      <button
        class="pill"
        type="button"
        style="--pill-color:${card.color || COLORS.entity}"
        @click=${() => this.openPill(card)}
        aria-label=${`${card.label} details`}
      >
        <ha-icon icon=${card.icon || ICONS.entity}></ha-icon>
        <span class="pill-body">
          <span class="pill-label">${card.label}</span>
          <span class="pill-value">${card.value}</span>
          ${card.status ? html`<span class="pill-status">${card.status}</span>` : html``}
          ${hasProgress
            ? html`<span class="pill-progress" title=${`${card.progress}%`}><span style=${`--pill-progress:${card.progress}%`}></span></span>`
            : html``}
        </span>
      </button>
    `;
  }

  renderDetailPanel(model) {
    const active = this._activeDetail;
    if (!active || !model.details?.[active]) return html``;
    const node = model[active];
    const icon = ICONS[active];
    const color = COLORS[active];
    const actions = model.actions?.[active] || [];
    return html`
      <div class="detail-backdrop" @click=${(event) => this.closeDetail(event)}>
        <section class="detail-panel" style="--pill-color:${color}" @click=${(event) => event.stopPropagation()} role="dialog" aria-label=${`${node.cardLabel} details`}>
          <div class="detail-head">
            <div>
              <div class="detail-label">${node.statusLabel}</div>
              <div class="detail-title"><ha-icon icon=${icon}></ha-icon> ${node.cardLabel}</div>
            </div>
            <button class="detail-close" type="button" @click=${() => this.closeDetail()} aria-label="Close details">×</button>
          </div>
          <div class="detail-body">
            ${model.details[active].map(
              (row) => html`
                <button class="detail-row ${row.entityId ? "has-entity" : ""}" type="button" @click=${() => this.openMoreInfo(row.entityId)}>
                  <span class="detail-row-label">${row.label}</span>
                  <span class="detail-row-value">${row.value}</span>
                </button>
              `,
            )}
            ${actions.length
              ? html`
                  <div class="detail-actions">
                    ${actions.map(
                      (action) => html`
                        <button
                          class="detail-action tone-${action.tone || "neutral"}"
                          type="button"
                          @click=${() => this.callQuickAction(action)}
                          aria-label=${action.stateLabel ? `${action.label}, ${action.stateLabel}` : action.label}
                        >
                          <ha-icon icon=${action.icon}></ha-icon>
                          <span class="detail-action-label">${action.label}</span>
                          ${action.stateLabel ? html`<span class="detail-action-state">${action.stateLabel}</span>` : html``}
                        </button>
                      `,
                    )}
                  </div>
                `
              : html``}
          </div>
        </section>
      </div>
    `;
  }

  openPill(card) {
    if (card.detailKind) {
      this.openDetail(card.detailKind);
      return;
    }
    if (card.entityId) this.openMoreInfo(card.entityId);
    else this.openDetail(card.kind);
  }

  openDetail(kind) {
    this._activeDetail = kind;
  }

  closeDetail(event) {
    event?.stopPropagation?.();
    this._activeDetail = null;
  }

  callQuickAction(action) {
    if (!action?.domain || !action?.serviceName) return;
    if (this.hass?.callService) {
      this.hass.callService(action.domain, action.serviceName, action.data || {}, action.target || {});
      return;
    }
    fireEvent(this, "hass-call-service", {
      domain: action.domain,
      service: action.serviceName,
      serviceData: action.data || {},
      target: action.target || {},
    });
  }

  openMoreInfo(entityId) {
    if (!entityId) return;
    fireEvent(this, "hass-more-info", { entityId });
  }
}

// ---------------------------------------------------------------------------
// First-run stub: guess sensible sensors from what the instance already has.
// ---------------------------------------------------------------------------

const STUB_ENTITY_GUESSES = [
  ["grid_power", "power", [/grid/i, /import/i, /mains/i, /\bmeter\b/i]],
  ["house_power", "power", [/house/i, /home/i, /\bload\b/i, /consum/i]],
  ["solar_power", "power", [/solar/i, /\bpv\b/i, /inverter/i]],
  ["battery_power", "power", [/batter/i, /powerwall/i]],
  ["ev_power", "power", [/\bev\b/i, /charger/i, /wallbox/i, /\bcar\b/i]],
  ["battery_soc", "battery", [/home batt/i, /powerwall/i, /batter/i]],
  ["ev_soc", "battery", [/\bev\b/i, /\bcar\b/i, /vehicle/i]],
];

export function guessStubEntities(hass) {
  const states = hass?.states || {};
  const taken = new Set();
  const guesses = {};
  for (const [key, deviceClass, patterns] of STUB_ENTITY_GUESSES) {
    const match = Object.entries(states).find(([id, entry]) => {
      if (taken.has(id) || !id.startsWith("sensor.") || entry?.attributes?.device_class !== deviceClass) return false;
      const haystack = `${id} ${entry?.attributes?.friendly_name || ""}`;
      return patterns.some((pattern) => pattern.test(haystack));
    });
    if (match) {
      guesses[key] = match[0];
      taken.add(match[0]);
    }
  }
  return guesses;
}

function stubConfigFor(hass) {
  if (!hass?.states) {
    return {
      show_ev: true,
      show_solar: true,
      show_battery: true,
      solar_capacity_kw: 5,
      entities: {
        sun: "sun.sun",
        grid_power: "sensor.grid_power_w",
        solar_power: "sensor.solar_power_w",
        house_power: "sensor.house_power_w",
        ev_power: "sensor.ev_charging_power_w",
        ev_soc: "sensor.ev_state_of_charge",
        battery_power: "sensor.battery_power_w",
        battery_soc: "sensor.battery_soc",
      },
    };
  }
  const guesses = guessStubEntities(hass);
  return {
    show_solar: Boolean(guesses.solar_power),
    show_battery: Boolean(guesses.battery_power || guesses.battery_soc),
    show_ev: Boolean(guesses.ev_power),
    entities: { sun: "sun.sun", ...guesses },
  };
}

// ---------------------------------------------------------------------------
// Visual editor
// ---------------------------------------------------------------------------

const sensor = { entity: { domain: "sensor" } };
const numberBox = (min, step) => ({ number: { min, step, mode: "box" } });
const text = { text: {} };
const boolean = { boolean: {} };
const multiEntity = { entity: { multiple: true } };

const EDITOR_FIELD_DEFS = [
  // Setup
  { name: "grid_power", label: "Grid power", helper: "Watts. Positive when importing, negative when exporting.", path: ["entities", "grid_power"], selector: sensor },
  { name: "house_power", label: "Home power", helper: "Watts. What the house is using right now.", path: ["entities", "house_power"], selector: sensor },
  { name: "show_solar", label: "Solar", path: ["show_solar"], selector: boolean, default: true },
  { name: "show_battery", label: "Battery", path: ["show_battery"], selector: boolean, default: true },
  { name: "show_ev", label: "EV", path: ["show_ev"], selector: boolean, default: false },

  // Solar
  { name: "solar_power", label: "Solar power", helper: "Watts.", path: ["entities", "solar_power"], selector: sensor },
  { name: "solar_capacity_kw", label: "Array size (kW)", helper: "Used for the efficiency percentage.", path: ["solar_capacity_kw"], selector: numberBox(0, 0.1) },
  { name: "solar_energy_today", label: "Generated today", helper: "kWh.", path: ["energy_today", "solar"], selector: sensor },
  { name: "solar_capacity", label: "Array size sensor", helper: "Optional alternative to a fixed array size.", path: ["entities", "solar_capacity"], selector: sensor },
  { name: "solar_node_extra", label: "Extra value on node", path: ["node_info", "solar", "entity"], selector: sensor },
  { name: "solar_detail", label: "Detail panel extras", helper: "Sensors become rows. Locks, switches and buttons become controls.", detailGroup: "solar", selector: multiEntity },

  // Battery
  { name: "battery_power", label: "Battery power", helper: "Watts. Positive when charging, negative when discharging.", path: ["entities", "battery_power"], selector: sensor },
  { name: "battery_soc", label: "State of charge", helper: "Percent.", path: ["entities", "battery_soc"], selector: sensor },
  { name: "battery_capacity_kwh", label: "Capacity (kWh)", helper: "Used for the reserve estimate.", path: ["battery_capacity_kwh"], selector: numberBox(0, 0.1) },
  { name: "battery_capacity", label: "Capacity sensor", helper: "Optional alternative to a fixed capacity.", path: ["entities", "battery_capacity"], selector: sensor },
  { name: "battery_charge_today", label: "Charged today", helper: "kWh.", path: ["energy_today", "battery_charge"], selector: sensor },
  { name: "battery_discharge_today", label: "Discharged today", helper: "kWh.", path: ["energy_today", "battery_discharge"], selector: sensor },
  { name: "battery_node_extra", label: "Extra value on node", path: ["node_info", "battery", "entity"], selector: sensor },
  { name: "battery_detail", label: "Detail panel extras", helper: "Sensors become rows. Locks, switches and buttons become controls.", detailGroup: "battery", selector: multiEntity },

  // EV
  { name: "ev_power", label: "Charge power", helper: "Watts. Negative values show as vehicle to home.", path: ["entities", "ev_power"], selector: sensor },
  { name: "ev_soc", label: "State of charge", helper: "Percent.", path: ["entities", "ev_soc"], selector: sensor },
  { name: "ev_charging_state", label: "Charging state", helper: "A binary sensor or a sensor with a charging state.", path: ["entities", "ev_charging_state"], selector: { entity: { domain: ["binary_sensor", "sensor"] } } },
  { name: "ev_energy_today", label: "Charged today", helper: "kWh.", path: ["energy_today", "ev"], selector: sensor },
  { name: "ev_node_extra", label: "Extra value on node", path: ["node_info", "ev", "entity"], selector: sensor },
  { name: "ev_detail", label: "Detail panel extras", helper: "Range, odometer, a lock, a boost switch. Locks, switches and buttons become controls.", detailGroup: "ev", selector: multiEntity },

  // Grid and home energy
  { name: "grid_import_today", label: "Imported today", helper: "kWh. Powers the self powered and grid cards.", path: ["energy_today", "grid_import"], selector: sensor },
  { name: "grid_export_today", label: "Exported today", helper: "kWh.", path: ["energy_today", "grid_export"], selector: sensor },
  { name: "home_energy_today", label: "Home used today", helper: "kWh.", path: ["energy_today", "home"], selector: sensor },
  { name: "grid_energy_today", label: "Net grid today", helper: "kWh. Optional when import and export are set.", path: ["energy_today", "grid"], selector: sensor },
  { name: "grid_node_extra", label: "Extra value on grid node", path: ["node_info", "grid", "entity"], selector: sensor },
  { name: "home_node_extra", label: "Extra value on home node", path: ["node_info", "house", "entity"], selector: sensor },
  { name: "grid_detail", label: "Grid detail extras", detailGroup: "grid", selector: multiEntity },
  { name: "house_detail", label: "Home detail extras", detailGroup: "house", selector: multiEntity },

  // Cost and tariff
  { name: "currency", label: "Currency symbol", path: ["tariffs", "currency"], selector: text },
  { name: "cost_today_entity", label: "Cost today", helper: "A daily cost sensor.", path: ["costs", "today_entity"], selector: sensor },
  { name: "cost_daily_budget", label: "Daily budget", helper: "Optional. Fills the cost today progress bar.", path: ["costs", "daily_budget"], selector: numberBox(0, 0.01) },
  { name: "import_rate_entity", label: "Import rate sensor", helper: "Per kWh. Best for time of use tariffs.", path: ["tariffs", "import_rate_entity"], selector: sensor },
  { name: "export_rate_entity", label: "Export rate sensor", helper: "Per kWh.", path: ["tariffs", "export_rate_entity"], selector: sensor },
  { name: "import_rate", label: "Fixed import rate", helper: "Per kWh. Used when no sensor is set.", path: ["tariffs", "import_rate"], selector: numberBox(0, 0.001) },
  { name: "export_rate", label: "Fixed export rate", helper: "Per kWh.", path: ["tariffs", "export_rate"], selector: numberBox(0, 0.001) },

  // Bottom bar
  { name: "show_bottom_bar", label: "Show bottom bar", path: ["show_bottom_bar"], selector: boolean, default: true },

  // Appearance
  { name: "grid_label", label: "Grid", path: ["labels", "grid"], selector: text },
  { name: "house_label", label: "Home", path: ["labels", "house"], selector: text },
  { name: "solar_label", label: "Solar", path: ["labels", "solar"], selector: text },
  { name: "battery_label", label: "Battery", path: ["labels", "battery"], selector: text },
  { name: "ev_label", label: "EV", path: ["labels", "ev"], selector: text },
  { name: "sun", label: "Sun entity", helper: "Switches the day and night scene.", path: ["entities", "sun"], selector: { entity: { domain: "sun" } } },
  {
    name: "time_of_day",
    label: "Scene",
    helper: "Follow the sun, or lock the card to day or night.",
    path: ["time_of_day"],
    selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "Follow the sun" }, { value: "day", label: "Always day" }, { value: "night", label: "Always night" }] } },
    default: "auto",
    deleteWhen: "auto",
  },
  { name: "weather", label: "Weather entity", helper: "Used by the weather glance card.", path: ["entities", "weather"], selector: { entity: { domain: "weather" } } },
  { name: "outdoor_temperature", label: "Outdoor temperature", helper: "Optional. Replaces the weather entity temperature.", path: ["entities", "outdoor_temperature"], selector: sensor },
  { name: "card_width", label: "Fixed width (px)", helper: "Leave blank to fill the column.", path: ["card_width"], selector: numberBox(MIN_CARD_WIDTH_PX, 1) },
  { name: "card_height", label: "Fixed height (px)", helper: "Leave blank to keep the scene aspect ratio.", path: ["card_height"], selector: numberBox(MIN_CARD_HEIGHT_PX, 1) },
];

const EDITOR_FIELD_BY_NAME = Object.fromEntries(EDITOR_FIELD_DEFS.map((field) => [field.name, field]));

// Rows are field names; a nested array is a two column row.
const EDITOR_SECTIONS = [
  { key: "setup", title: "Setup", secondary: "The two sensors every home needs, then the systems you have.", expanded: true, rows: [["grid_power", "house_power"], ["show_solar", "show_battery", "show_ev"]] },
  { key: "solar", title: "Solar", system: "solar", rows: [["solar_power", "solar_capacity_kw"], ["solar_energy_today", "solar_capacity"], "solar_node_extra", "solar_detail"] },
  { key: "battery", title: "Battery", system: "battery", rows: [["battery_power", "battery_soc"], ["battery_capacity_kwh", "battery_capacity"], ["battery_charge_today", "battery_discharge_today"], "battery_node_extra", "battery_detail"] },
  { key: "ev", title: "EV", system: "ev", rows: [["ev_power", "ev_soc"], ["ev_charging_state", "ev_energy_today"], "ev_node_extra", "ev_detail"] },
  { key: "energy", title: "Grid and home energy", secondary: "Daily totals for the glance cards and detail panels.", rows: [["grid_import_today", "grid_export_today"], ["home_energy_today", "grid_energy_today"], ["grid_node_extra", "home_node_extra"], "grid_detail", "house_detail"] },
  { key: "cost", title: "Cost and tariff", rows: [["currency", "cost_today_entity"], "cost_daily_budget", ["import_rate_entity", "export_rate_entity"], ["import_rate", "export_rate"]] },
  { key: "bottom_bar", title: "Bottom bar", secondary: "Up to five glance cards.", rows: ["show_bottom_bar"], bottomBar: true },
  { key: "appearance", title: "Appearance", rows: [["grid_label", "house_label"], ["solar_label", "battery_label"], "ev_label", ["sun", "time_of_day"], ["weather", "outdoor_temperature"], ["card_width", "card_height"]] },
];

const SYSTEM_TOGGLES = { solar: "show_solar", ev: "show_ev", battery: "show_battery" };

function bottomSlotName(index, suffix = "") {
  return `bottom_bar_slot_${index + 1}${suffix}`;
}

function cloneConfigForEditor(config) {
  return JSON.parse(JSON.stringify(config || {}));
}

function readConfigPath(config, path) {
  let value = config || {};
  for (const key of path) value = value?.[key];
  return value;
}

function writeConfigPath(config, path, value) {
  let target = config;
  for (const key of path.slice(0, -1)) {
    target[key] = { ...(target[key] || {}) };
    target = target[key];
  }
  target[path[path.length - 1]] = value;
}

function deleteConfigPath(config, path) {
  const stack = [];
  let target = config;
  for (const key of path.slice(0, -1)) {
    if (!target?.[key]) return;
    stack.push([target, key]);
    target = target[key];
  }
  delete target[path[path.length - 1]];
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const [parent, key] = stack[index];
    if (parent[key] && typeof parent[key] === "object" && !Object.keys(parent[key]).length) delete parent[key];
  }
}

function detailEntityIds(config, group) {
  return detailEntityEntries(config, group)
    .map((entry) => entry.entity)
    .filter(Boolean);
}

function editorSystemVisible(data, system) {
  if (!system) return true;
  return data[SYSTEM_TOGGLES[system]] !== false;
}

function bottomCardOptionsFor(data) {
  return BOTTOM_CARD_OPTIONS.filter((option) => editorSystemVisible(data, option.system));
}

export function editorDataFromConfig(config) {
  const data = {};
  for (const field of EDITOR_FIELD_DEFS) {
    if (field.detailGroup) {
      data[field.name] = detailEntityIds(config, field.detailGroup);
      continue;
    }
    const value = readConfigPath(config, field.path);
    if (value !== undefined && value !== null) data[field.name] = value;
    else if (field.default !== undefined) data[field.name] = field.default;
  }
  const configured = configuredBottomBar(config) || [];
  for (let index = 0; index < MAX_BOTTOM_CARDS; index += 1) {
    const item = configured[index];
    const type = typeof item === "string" ? item : item?.type;
    data[bottomSlotName(index)] = type || "none";
    if (typeof item === "object" && item?.entity) data[bottomSlotName(index, "_entity")] = item.entity;
    if (typeof item === "object" && item?.label) data[bottomSlotName(index, "_label")] = item.label;
  }
  return data;
}

function nextDetailEntries(config, group, ids) {
  const existing = detailEntityEntries(config, group);
  const raw = config.detail_entities?.[group];
  return ids.map((entityId) => {
    const match = existing.find((entry) => entry.entity === entityId);
    if (!match || match.auto) return entityId;
    const { auto, listed, ...rest } = match;
    if (Array.isArray(raw)) return rest;
    const { key, ...value } = rest;
    return { key, ...value };
  });
}

export function editorDataToConfig(previousConfig, data) {
  const config = cloneConfigForEditor(previousConfig);
  for (const field of EDITOR_FIELD_DEFS) {
    if (field.detailGroup) {
      const ids = Array.isArray(data[field.name]) ? data[field.name] : [];
      const current = detailEntityIds(previousConfig, field.detailGroup);
      if (ids.join("|") === current.join("|")) continue;
      if (!ids.length) deleteConfigPath(config, ["detail_entities", field.detailGroup]);
      else writeConfigPath(config, ["detail_entities", field.detailGroup], nextDetailEntries(previousConfig, field.detailGroup, ids));
      continue;
    }
    const value = data[field.name];
    const empty = value === "" || value === undefined || value === null || value === field.deleteWhen;
    if (empty) deleteConfigPath(config, field.path);
    else writeConfigPath(config, field.path, value);
  }

  const slotKeys = Array.from({ length: MAX_BOTTOM_CARDS }, (_, index) => bottomSlotName(index));
  if (slotKeys.some((key) => Object.hasOwn(data, key))) {
    const previousItems = configuredBottomBar(previousConfig) || [];
    const nextItems = slotKeys
      .map((key, index) => {
        const type = data[key] || "none";
        if (type === "none") return null;
        const previous = previousItems[index];
        const base = previous && typeof previous === "object" && previous.type === type ? { ...previous } : {};
        const item = { ...base, type };
        const entity = data[bottomSlotName(index, "_entity")];
        const label = data[bottomSlotName(index, "_label")];
        if (type === "entity") {
          if (entity) item.entity = entity;
          else delete item.entity;
        }
        if (label) item.label = label;
        else if (Object.hasOwn(data, bottomSlotName(index, "_label"))) delete item.label;
        return item;
      })
      .filter(Boolean);
    if (nextItems.length) config.bottom_bar = nextItems;
    else deleteConfigPath(config, ["bottom_bar"]);
  }
  return config;
}

function schemaFor(name) {
  const field = EDITOR_FIELD_BY_NAME[name];
  return field ? { name: field.name, selector: field.selector } : null;
}

function rowsToSchema(rows) {
  return rows
    .map((row) => (Array.isArray(row) ? { name: "", type: "grid", schema: row.map(schemaFor).filter(Boolean) } : schemaFor(row)))
    .filter(Boolean);
}

function bottomBarSchema(data) {
  const options = bottomCardOptionsFor(data).map(({ value, label }) => ({ value, label }));
  const schema = [];
  for (let index = 0; index < MAX_BOTTOM_CARDS; index += 1) {
    schema.push({ name: bottomSlotName(index), selector: { select: { mode: "dropdown", options: [{ value: "none", label: "None" }, ...options] } } });
    if (data[bottomSlotName(index)] === "entity") {
      schema.push({
        name: "",
        type: "grid",
        schema: [
          { name: bottomSlotName(index, "_entity"), selector: { entity: {} } },
          { name: bottomSlotName(index, "_label"), selector: text },
        ],
      });
    }
  }
  return schema;
}

export function editorSectionsForConfig(config) {
  const data = editorDataFromConfig(config);
  return EDITOR_SECTIONS.map((section) => ({
    key: section.key,
    title: section.title,
    secondary: section.secondary,
    expanded: Boolean(section.expanded),
    visible: editorSystemVisible(data, section.system),
    schema: [...rowsToSchema(section.rows), ...(section.bottomBar ? bottomBarSchema(data) : [])],
  }));
}

function flattenSchemaNames(schema) {
  return schema.flatMap((entry) => (entry.type === "grid" ? flattenSchemaNames(entry.schema) : [entry.name]));
}

export function editorFieldsForConfig(config) {
  return editorSectionsForConfig(config)
    .filter((section) => section.visible)
    .flatMap((section) => flattenSchemaNames(section.schema));
}

function editorLabel(schema) {
  const field = EDITOR_FIELD_BY_NAME[schema.name];
  if (field) return field.label;
  const slot = schema.name.match(/^bottom_bar_slot_(\d+)(_entity|_label)?$/);
  if (slot) return slot[2] === "_entity" ? "Entity" : slot[2] === "_label" ? "Label" : `Card ${slot[1]}`;
  return schema.name;
}

function editorHelper(schema) {
  return EDITOR_FIELD_BY_NAME[schema.name]?.helper;
}

class HacsHomeEnergyCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = css`
    .editor {
      display: grid;
      gap: 10px;
    }

    ha-expansion-panel {
      --expansion-panel-summary-padding: 0 12px;
      --expansion-panel-content-padding: 0 12px 12px;
    }

    .section-body {
      display: grid;
      gap: 8px;
      padding-top: 4px;
    }

    .setup {
      display: grid;
      gap: 6px;
      padding: 4px 0 6px;
    }

    .setup-title {
      color: var(--primary-text-color);
      font-size: 15px;
      font-weight: 600;
    }

    .setup-secondary {
      margin-bottom: 4px;
      color: var(--secondary-text-color);
      font-size: 13px;
    }

    ha-form {
      width: 100%;
    }
  `;

  setConfig(config) {
    this._config = config || {};
  }

  render() {
    const data = editorDataFromConfig(this._config);
    const sections = editorSectionsForConfig(this._config);
    return html`
      <div class="editor">
        ${sections.map((section) =>
          section.key === "setup"
            ? html`
                <div class="setup">
                  <div class="setup-title">${section.title}</div>
                  <div class="setup-secondary">${section.secondary}</div>
                  ${this.renderForm(section, data)}
                </div>
              `
            : html`
                <ha-expansion-panel outlined .header=${section.title} .secondary=${section.secondary || ""} .expanded=${section.expanded} ?hidden=${!section.visible}>
                  <div class="section-body">${this.renderForm(section, data)}</div>
                </ha-expansion-panel>
              `,
        )}
      </div>
    `;
  }

  renderForm(section, data) {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${section.schema}
        .computeLabel=${editorLabel}
        .computeHelper=${editorHelper}
        @value-changed=${this.valueChanged}
      ></ha-form>
    `;
  }

  valueChanged(event) {
    event.stopPropagation();
    const data = { ...editorDataFromConfig(this._config), ...(event.detail.value || {}) };
    const config = editorDataToConfig(this._config, data);
    this._config = config;
    fireEvent(this, "config-changed", { config });
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

if (typeof customElements !== "undefined" && !customElements.get("hacs-home-energy-card")) {
  customElements.define("hacs-home-energy-card", HacsHomeEnergyCard);
}

if (typeof customElements !== "undefined" && !customElements.get("hacs-home-energy-card-editor")) {
  customElements.define("hacs-home-energy-card-editor", HacsHomeEnergyCardEditor);
}

if (typeof window !== "undefined") {
  window.customCards = window.customCards || [];
  const cardPickerEntry = {
    type: "hacs-home-energy-card",
    name: "HACS Home Energy Card",
    description: "Cinematic home energy dashboard with solar, grid, EV, battery, cost, and weather glance cards.",
    preview: true,
    documentationURL: "https://github.com/RoBro92/HACS-home-energy-card/blob/main/docs/setup.md",
  };
  const existingEntryIndex = window.customCards.findIndex((card) => card?.type === cardPickerEntry.type);
  if (existingEntryIndex === -1) window.customCards.push(cardPickerEntry);
  else window.customCards[existingEntryIndex] = { ...window.customCards[existingEntryIndex], ...cardPickerEntry };
}

export { HacsHomeEnergyCard, HacsHomeEnergyCardEditor, BOTTOM_CARD_OPTIONS };
