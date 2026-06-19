const litRuntime = await resolveLitRuntime();
const { LitElement, html, css } = litRuntime;

const DEFAULT_BACKGROUND_FULL = "/local/energy-bg-full.jpg";
const DEFAULT_BACKGROUND_NO_EV = "/local/energy-bg-no-ev.jpg";
const MODULE_BASE_URL = new URL(".", import.meta.url);
const ACTIVE_THRESHOLD_W = 25;
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 19;
const MIN_CARD_WIDTH_PX = 320;
const MIN_CARD_HEIGHT_PX = 180;
const MAX_BOTTOM_CARDS = 5;

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
  full: {
    day: bundledAsset("energy-bg-full-day.png"),
    night: bundledAsset("energy-bg-full-night.png"),
  },
  ev_solar: {
    day: bundledAsset("energy-bg-ev-solar-day.png"),
    night: bundledAsset("energy-bg-ev-solar-night.png"),
  },
  ev_battery: {
    day: bundledAsset("energy-bg-ev-battery-day.png"),
    night: bundledAsset("energy-bg-ev-battery-night.png"),
  },
  solar_battery: {
    day: bundledAsset("energy-bg-no-ev-day.png"),
    night: bundledAsset("energy-bg-no-ev-night.png"),
  },
  ev_only: {
    day: bundledAsset("energy-bg-no-solar-battery-day.png"),
    night: bundledAsset("energy-bg-no-solar-battery-night.png"),
  },
  solar_only: {
    day: bundledAsset("energy-bg-solar-only-day.png"),
    night: bundledAsset("energy-bg-solar-only-night.png"),
  },
  battery_only: {
    day: bundledAsset("energy-bg-battery-only-day.png"),
    night: bundledAsset("energy-bg-battery-only-night.png"),
  },
  base: {
    day: bundledAsset("energy-bg-base-day.png"),
    night: bundledAsset("energy-bg-base-night.png"),
  },
};

async function resolveLitRuntime() {
  if (typeof window !== "undefined" && window.LitElement && window.html && window.css) {
    return {
      LitElement: window.LitElement,
      html: window.html,
      css: window.css,
    };
  }

  if (typeof window !== "undefined") {
    return import("https://cdn.jsdelivr.net/npm/lit@3/+esm");
  }

  const passthrough = (strings, ...values) =>
    strings.reduce((result, part, index) => `${result}${part}${values[index] ?? ""}`, "");
  return {
    LitElement: class {},
    html: passthrough,
    css: passthrough,
  };
}

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

function pixelDimension(value, minimum) {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  return `${Math.max(minimum, Math.round(parsed))}px`;
}

function cardSizeModel(config) {
  const minWidth = pixelDimension(config.min_width ?? config.minWidth, MIN_CARD_WIDTH_PX) || `${MIN_CARD_WIDTH_PX}px`;
  const minHeight = pixelDimension(config.min_height ?? config.minHeight, MIN_CARD_HEIGHT_PX) || `${MIN_CARD_HEIGHT_PX}px`;
  const widthMinimum = parseNumber(minWidth) ?? MIN_CARD_WIDTH_PX;
  const heightMinimum = parseNumber(minHeight) ?? MIN_CARD_HEIGHT_PX;
  return {
    width: pixelDimension(config.card_width ?? config.cardWidth ?? config.width, widthMinimum),
    height: pixelDimension(config.card_height ?? config.cardHeight ?? config.height, heightMinimum),
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

function capacityWattsFromEntity(hass, entityId) {
  const parsed = parseNumber(stateValue(hass, entityId));
  if (parsed === null) return null;

  const unit = String(stateAttributes(hass, entityId).unit_of_measurement || "").toLowerCase();
  if (unit === "w" || unit === "watts") return parsed;
  if (unit === "kw" || unit === "kilowatts") return parsed * 1000;
  return parsed <= 100 ? parsed * 1000 : parsed;
}

function batteryCapacityKwhFromEntity(hass, entityId) {
  const parsed = parseNumber(stateValue(hass, entityId));
  if (parsed === null) return null;

  const unit = String(stateAttributes(hass, entityId).unit_of_measurement || "").toLowerCase();
  if (unit === "wh") return parsed / 1000;
  if (unit === "kwh") return parsed;
  return parsed;
}

function solarCapacityWatts(config, hass, entities) {
  const configured = parseNumber(config.solar_capacity_kw ?? config.solarCapacityKw);
  if (configured !== null) return configured * 1000;
  return capacityWattsFromEntity(hass, entities.solar_capacity);
}

function batteryCapacityKwh(config, hass, entities) {
  const configured = parseNumber(config.battery_capacity_kwh ?? config.batteryCapacityKwh);
  if (configured !== null) return configured;
  return batteryCapacityKwhFromEntity(hass, entities.battery_capacity);
}

function formatSolarEfficiency(solarWatts, capacityWatts) {
  if (!capacityWatts || capacityWatts <= 0) return null;
  const efficiency = Math.max(0, Math.round(((parseNumber(solarWatts) ?? 0) / capacityWatts) * 100));
  return `${efficiency}%`;
}

function normaliseStateLabel(value, fallback) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw || raw === "unknown" || raw === "unavailable") return fallback;
  if (["on", "true", "charging"].includes(raw)) return "charging";
  if (["off", "false", "not_charging", "not charging"].includes(raw)) return "not charging";
  return raw.replace(/_/g, " ");
}

function joinLabels(parts) {
  return parts.filter((part) => part && part !== "-").join(" / ");
}

function titleCaseLabel(value) {
  return String(value ?? "")
    .split(" / ")
    .map((part) =>
      part.replace(/\b[a-z]/g, (letter) => letter.toUpperCase()),
    )
    .join(" / ");
}

function configChoice(value, choices, fallback) {
  const raw = String(value ?? "").trim().toLowerCase();
  return choices.includes(raw) ? raw : fallback;
}

function entityDisplayValue(hass, entityId) {
  const value = stateValue(hass, entityId);
  if (value === "unknown" || value === "unavailable") return "-";
  const unit = stateAttributes(hass, entityId).unit_of_measurement;
  if (unit === "%") return `${value}%`;
  return unit ? `${value} ${unit}` : String(value);
}

function detailRow(label, value, entityId) {
  if (!value || value === "-") return null;
  return { label, value, entityId };
}

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
  cost: "mdi:currency-gbp",
  selfPowered: "mdi:home-lightning-bolt",
  solar: "mdi:solar-power-variant",
  house: "mdi:home",
  ev: "mdi:car-electric",
  battery: "mdi:home-battery",
  sun: "mdi:weather-sunset",
  weather: "mdi:weather-partly-cloudy",
  entity: "mdi:information-outline",
};

const COLORS = {
  grid: "#58bfff",
  cost: "#8ee6a5",
  selfPowered: "#7ee8ff",
  solar: "#ffd15a",
  house: "#ffffff",
  ev: "#50eaff",
  battery: "#56f0d0",
  sun: "#ffb86b",
  weather: "#a7d8ff",
  entity: "#d9f2ff",
};

function configLabels(config = {}) {
  return {
    ...DEFAULT_LABELS,
    ...(config.labels || {}),
  };
}

function readConfiguredEntity(config, key) {
  const groups = [config.node_info, config.nodeInfo, config.node_entities, config.nodeEntities];
  for (const group of groups) {
    if (group?.[key]) return group[key];
  }
  return null;
}

function nodeExtraLabel(config, hass, key) {
  const entry = readConfiguredEntity(config, key);
  if (!entry) return null;
  if (typeof entry === "string") return entityDisplayValue(hass, entry);
  if (typeof entry === "object" && entry.entity) {
    const value = entityDisplayValue(hass, entry.entity);
    if (!value || value === "-") return null;
    return entry.label ? `${entry.label} ${value}` : value;
  }
  return null;
}

function rateValue(config, hass, direction) {
  const tariffs = config.tariffs || config.rates || {};
  const nested = tariffs[direction] || {};
  const entity =
    nested.rate_entity ||
    nested.entity ||
    tariffs[`${direction}_rate_entity`] ||
    tariffs[`${direction}RateEntity`];
  const fixed =
    nested.rate ??
    nested.default_rate ??
    tariffs[`${direction}_rate`] ??
    tariffs[`${direction}Rate`];
  return parseNumber(stateValue(hass, entity)) ?? parseNumber(fixed);
}

function currencySymbol(config) {
  return config.tariffs?.currency || config.rates?.currency || config.currency || "£";
}

function formatMoneyPerHour(value, currency) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  const prefix = parsed < 0 ? "-" : "";
  return `${prefix}${currency}${Math.abs(parsed).toFixed(2)}/h`;
}

function formatMoney(value, currency) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  const prefix = parsed < 0 ? "-" : "";
  return `${prefix}${currency}${Math.abs(parsed).toFixed(2)}`;
}

function formatTemperature(value, unit = "°C") {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  return `${Math.round(parsed * 10) / 10}${unit || "°C"}`;
}

function progressPercent(value, target) {
  const parsed = parseNumber(value);
  const parsedTarget = parseNumber(target);
  if (parsed === null || parsedTarget === null || parsedTarget <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((parsed / parsedTarget) * 100)));
}

function gridCostModel(config, hass, gridWatts) {
  const importing = gridWatts >= 0;
  const rate = rateValue(config, hass, importing ? "import" : "export");
  if (rate === null) {
    return {
      watts: gridWatts,
      rate: null,
      status: importing ? "import cost" : "export credit",
      displayStatus: importing ? "Import Cost" : "Export Credit",
      valueLabel: "-",
    };
  }
  const hourly = (Math.abs(gridWatts) / 1000) * rate * (importing ? 1 : -1);
  return {
    watts: gridWatts,
    rate,
    status: importing ? "import cost" : "export credit",
    displayStatus: importing ? "Import Cost" : "Export Credit",
    valueLabel: formatMoneyPerHour(hourly, currencySymbol(config)),
  };
}

function costsConfig(config) {
  return config.costs || config.cost_config || config.costConfig || {};
}

function costTodayCard(config, hass) {
  const costs = costsConfig(config);
  const entity = costs.today_entity || costs.todayEntity || config.entities?.cost_today;
  const value = parseNumber(stateValue(hass, entity));
  const budget = parseNumber(costs.daily_budget ?? costs.dailyBudget);
  return {
    kind: "cost_today",
    label: "Cost Today",
    status: budget ? "Budget" : "Today",
    value: formatMoney(value, currencySymbol(config)),
    progress: progressPercent(value, budget),
    progressLabel: budget ? `${formatMoney(value, currencySymbol(config))} / ${formatMoney(budget, currencySymbol(config))}` : null,
    icon: ICONS.cost,
    color: COLORS.cost,
    detailKind: "grid",
    entityId: entity,
  };
}

function energyTodayEntity(config, key, fallbackGroup, fallbackKey) {
  const energyToday = config.energy_today || config.energyToday || {};
  const detailEntities = config.detail_entities || config.detailEntities || {};
  return energyToday[key] || energyToday[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] || detailEntities[fallbackGroup]?.[fallbackKey];
}

function energyTodayNumber(config, hass, key, fallbackGroup, fallbackKey) {
  return parseNumber(stateValue(hass, energyTodayEntity(config, key, fallbackGroup, fallbackKey)));
}

function selfPoweredTodayCard(config, hass) {
  const home = energyTodayNumber(config, hass, "home", "house", "energy_24h");
  let imported = energyTodayNumber(config, hass, "grid_import", "grid", "import_24h");
  if (imported === null) imported = Math.max(0, energyTodayNumber(config, hass, "grid", "grid", "import_24h") ?? 0);
  const percent = home && home > 0 ? Math.max(0, Math.min(100, Math.round(((home - imported) / home) * 100))) : null;
  return {
    kind: "self_powered_today",
    label: "Self Powered",
    status: "Today",
    value: percent === null ? "-" : `${percent}%`,
    progress: percent,
    icon: ICONS.selfPowered,
    color: COLORS.selfPowered,
    detailKind: "house",
  };
}

function gridImportExportCard(config, hass) {
  const imported = energyTodayNumber(config, hass, "grid_import", "grid", "import_24h");
  const exported = energyTodayNumber(config, hass, "grid_export", "grid", "export_24h");
  const importLabel = formatEnergy(imported);
  const exportLabel = formatEnergy(exported);
  return {
    kind: "grid_import_export",
    label: "Grid Energy",
    status: "Import / Export",
    value: `${importLabel.replace(" kWh", "")} / ${exportLabel}`,
    progress: imported !== null && exported !== null && imported + exported > 0 ? Math.round((exported / (imported + exported)) * 100) : null,
    icon: ICONS.grid,
    color: COLORS.grid,
    detailKind: "grid",
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
    label: "Battery Reserve",
    status: "Reserve",
    value: formatHours(reserveHours),
    progress: soc,
    icon: ICONS.battery,
    color: COLORS.battery,
    detailKind: "battery",
  };
}

function batteryDischargeCard(config, hass) {
  const entity = energyTodayEntity(config, "battery_discharge", "battery", "discharge_24h");
  return {
    kind: "battery_discharge",
    label: "Battery Discharge",
    status: "Today",
    value: formatEnergy(stateValue(hass, entity)),
    icon: ICONS.battery,
    color: COLORS.battery,
    detailKind: "battery",
    entityId: entity,
  };
}

function weatherCard(config, hass) {
  const entity = config.entities?.weather || config.weather_entity || config.weatherEntity;
  const temperatureEntity = config.entities?.outdoor_temperature || config.temperature_entity || config.temperatureEntity;
  const attrs = stateAttributes(hass, entity);
  const temperature = temperatureEntity ? stateValue(hass, temperatureEntity) : attrs.temperature;
  const unit = temperatureEntity ? stateAttributes(hass, temperatureEntity).unit_of_measurement : attrs.temperature_unit;
  const rawState = stateValue(hass, entity);
  return {
    kind: "weather",
    label: "Weather",
    status: weatherStateLabel(rawState),
    value: formatTemperature(temperature, unit),
    icon: ICONS.weather,
    color: COLORS.weather,
    entityId: entity || temperatureEntity,
  };
}

function weatherStateLabel(value) {
  const raw = String(value || "unknown").toLowerCase();
  const labels = {
    "clear-night": "Clear Night",
    cloudy: "Cloudy",
    fog: "Fog",
    hail: "Hail",
    lightning: "Lightning",
    "lightning-rainy": "Lightning Rain",
    partlycloudy: "Partly Cloudy",
    pouring: "Pouring",
    rainy: "Rainy",
    snowy: "Snowy",
    "snowy-rainy": "Snowy Rain",
    sunny: "Sunny",
    windy: "Windy",
    "windy-variant": "Windy",
  };
  return labels[raw] || titleCaseLabel(raw.replace(/-/g, " ").replace(/_/g, " "));
}

function formatEventTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function sunCardModel(config, hass) {
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
  };
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
    data: action.data || action.service_data || action.serviceData || {},
    entityId: action.entity || action.entity_id || action.entityId || action.target?.entity_id,
    stateLabel: action.state_label || action.stateLabel,
    tone: action.tone || "neutral",
  };
}

const DETAIL_CONTROL_DOMAINS = new Set(["button", "input_button", "lock", "switch"]);

function entityDomain(entityId) {
  return String(entityId || "").split(".")[0];
}

function entityName(hass, entityId, fallback) {
  return stateAttributes(hass, entityId).friendly_name || fallback || labelFromDetailKey(String(entityId || "").split(".").pop());
}

function normaliseDetailEntry(key, value) {
  if (typeof value === "string") return { key, entity: value };
  if (!value || typeof value !== "object") return null;
  return {
    ...value,
    key: value.key || key,
    entity: value.entity || value.entity_id || value.entityId,
  };
}

function detailEntityEntries(config, group) {
  const detailEntities = config.detail_entities || config.detailEntities || {};
  const entries = detailEntities[group] || {};
  if (Array.isArray(entries)) {
    return entries
      .map((entry, index) =>
        normaliseDetailEntry(entry?.key || entry?.name || entry?.label || `item_${index + 1}`, entry),
      )
      .filter(Boolean);
  }
  return Object.entries(entries).map(([key, value]) => normaliseDetailEntry(key, value)).filter(Boolean);
}

function isControlDetailEntry(entry) {
  if (entry?.service) return true;
  const domain = entityDomain(entry?.entity);
  return DETAIL_CONTROL_DOMAINS.has(domain) && entry?.display !== "row";
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
      stateLabel: entry?.state_label || entry?.stateLabel,
      tone: "neutral",
    };
  }

  return null;
}

function configuredDetailActions(config, hass, group) {
  return detailEntityEntries(config, group).filter(isControlDetailEntry).map((entry) => detailControlAction(entry, hass)).filter(Boolean);
}

function buildActions(config, hass) {
  const actions = config.actions || config.quick_actions || config.quickActions || {};
  return Object.fromEntries(
    ["grid", "solar", "house", "ev", "battery"].map((key) => [
      key,
      [
        ...configuredDetailActions(config, hass, key),
        ...(Array.isArray(actions[key]) ? actions[key] : []).map(normaliseAction).filter(Boolean),
      ],
    ]),
  );
}

function predefinedBottomCard(type, model, config, hass) {
  const normalisedType = {
    cost: "cost_now",
    current_cost: "cost_now",
    budget: "cost_today",
    self_powered: "self_powered_today",
    grid_energy: "grid_import_export",
  }[type] || type;

  const cards = {
    grid: {
      kind: "grid",
      label: model.grid.cardLabel,
      status: model.grid.displayStatus,
      value: model.grid.powerLabel,
      icon: ICONS.grid,
      color: COLORS.grid,
    },
    cost_now: {
      kind: "cost",
      label: "Grid cost",
      status: model.cost.displayStatus,
      value: model.cost.valueLabel,
      icon: ICONS.cost,
      color: COLORS.cost,
      detailKind: "grid",
    },
    cost_today: costTodayCard(config, hass),
    self_powered_today: selfPoweredTodayCard(config, hass),
    grid_import_export: gridImportExportCard(config, hass),
    battery_reserve: model.visible.battery ? batteryReserveCard(model) : null,
    battery_discharge: model.visible.battery ? batteryDischargeCard(config, hass) : null,
    weather: weatherCard(config, hass),
    solar: {
      kind: "solar",
      label: model.solar.label,
      status: model.solar.displayStatus,
      value: model.solar.pillValue,
      icon: ICONS.solar,
      color: COLORS.solar,
    },
    house: {
      kind: "house",
      label: model.house.label,
      status: model.house.displayStatus,
      value: model.house.powerLabel,
      icon: ICONS.house,
      color: COLORS.house,
    },
    ev: {
      kind: "ev",
      label: model.ev.cardLabel,
      status: model.ev.displayStatus,
      value: model.ev.pillValue,
      icon: ICONS.ev,
      color: COLORS.ev,
    },
    battery: {
      kind: "battery",
      label: model.battery.label,
      status: model.battery.displayStatus,
      value: model.battery.pillValue,
      icon: ICONS.battery,
      color: COLORS.battery,
    },
  };
  return cards[normalisedType] || null;
}

function customBottomCard(item, config, hass, model) {
  const type = typeof item === "string" ? item : item?.type;
  if (!type || type === "none") return null;
  if (["solar", "ev", "battery"].includes(type) && !model.visible[type]) return null;
  if (type === "sun") return { ...sunCardModel(config, hass), ...(typeof item === "object" ? item : {}) };
  if (type === "entity" && typeof item === "object" && item.entity) {
    return {
      kind: "entity",
      label: item.label || labelFromDetailKey(item.entity.split(".").pop()),
      status: item.status || "",
      value: entityDisplayValue(hass, item.entity),
      icon: item.icon || ICONS.entity,
      color: item.color || COLORS.entity,
      entityId: item.entity,
    };
  }
  const card = predefinedBottomCard(type, model, config, hass);
  if (!card) return null;
  return typeof item === "object"
    ? {
        ...card,
        label: item.label || card.label,
        status: item.status || card.status,
        icon: item.icon || card.icon,
        color: item.color || card.color,
        detailKind: item.detailKind || item.detail_kind || card.detailKind,
      }
    : card;
}

function bottomBarLimit(config) {
  const parsed = parseNumber(config.bottom_bar_limit ?? config.bottomBarLimit);
  if (parsed === null) return MAX_BOTTOM_CARDS;
  return Math.max(1, Math.min(MAX_BOTTOM_CARDS, Math.round(parsed)));
}

function configuredBottomBar(config) {
  const configured = config.bottom_bar || config.bottomBar;
  return Array.isArray(configured) ? configured : null;
}

function buildBottomCards(config, hass, model, limit = true) {
  const configured = config.bottom_bar || config.bottomBar;
  const maxCards = limit ? bottomBarLimit(config) : Number.POSITIVE_INFINITY;
  let cards;
  if (Array.isArray(configured) && configured.length) {
    cards = configured.map((item) => customBottomCard(item, config, hass, model)).filter(Boolean);
  } else {
    cards = [
      predefinedBottomCard("cost_today", model, config, hass),
      predefinedBottomCard("self_powered_today", model, config, hass),
      predefinedBottomCard("grid_import_export", model, config, hass),
      model.visible.battery ? predefinedBottomCard("battery_reserve", model, config, hass) : null,
      predefinedBottomCard("sun", model, config, hass) || sunCardModel(config, hass),
    ].filter(Boolean);
  }
  return cards.slice(0, maxCards);
}

function labelFromDetailKey(key) {
  if (DETAIL_LABELS[key]) return DETAIL_LABELS[key];
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function configuredDetailRows(config, hass, group) {
  return detailEntityEntries(config, group)
    .filter((entry) => !isControlDetailEntry(entry))
    .map((entry) =>
      detailRow(entry.label || labelFromDetailKey(entry.key), detailEntityDisplayValue(hass, entry), entry.entity),
    )
    .filter(Boolean);
}

function detailEntityDisplayValue(hass, entry) {
  const key = String(entry?.key || entry?.label || "").toLowerCase();
  if (!key.includes("odometer")) return entityDisplayValue(hass, entry.entity);

  const parsed = parseNumber(stateValue(hass, entry.entity));
  if (parsed === null) return entityDisplayValue(hass, entry.entity);

  const unit = stateAttributes(hass, entry.entity).unit_of_measurement;
  const rounded = String(Math.round(parsed));
  return unit ? `${rounded} ${unit}` : rounded;
}

function buildDetailGroups(config, hass, model, energyToday) {
  return {
    grid: [
      detailRow("Grid power", model.grid.powerLabel, model.entities.grid_power),
      detailRow("Status", model.grid.displayStatus),
      detailRow("Current cost", model.cost.valueLabel),
      detailRow(model.cost.rate === null ? null : `${model.cost.displayStatus} rate`, model.cost.rate === null ? null : `${model.cost.rate}/kWh`),
      detailRow("Energy today", model.energyToday.grid, energyToday.grid),
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
      ...configuredDetailRows(config, hass, "ev"),
    ].filter(Boolean),
    battery: [
      detailRow("Battery power", model.battery.powerLabel, model.entities.battery_power),
      detailRow("State of charge", model.battery.socLabel, model.entities.battery_soc),
      detailRow("Capacity", model.battery.capacityLabel, model.entities.battery_capacity),
      ...configuredDetailRows(config, hass, "battery"),
    ].filter(Boolean),
  };
}

export function entityEnabled(value, hass, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const raw = String(value).trim();
  if (!raw) return fallback;
  if (raw.includes(".")) {
    const entityState = stateValue(hass, raw);
    return ["on", "true", "home", "charging", "plugged_in", "connected", "open"].includes(
      String(entityState).toLowerCase(),
    );
  }

  return ["on", "true", "yes", "1", "enabled", "show"].includes(raw.toLowerCase());
}

export function flowSpeedSeconds(value) {
  const watts = Math.abs(parseNumber(value) ?? 0);
  if (watts <= ACTIVE_THRESHOLD_W) return 0;
  if (watts <= 50) return 8;
  if (watts >= 8000) return 1.2;
  const seconds = 8 - (watts / 8000) * 6.8;
  return Number(Math.max(1.2, Math.min(8, seconds)).toFixed(2));
}

export function timeOfDay(config = {}, hass, now = new Date()) {
  const configured = config.time_of_day ?? config.timeOfDay;
  if (configured) {
    if (typeof configured === "string" && configured.includes(".")) {
      const value = String(stateValue(hass, configured)).toLowerCase();
      if (["above_horizon", "day", "sunny", "on", "true"].includes(value)) return "day";
      if (["below_horizon", "night", "off", "false"].includes(value)) return "night";
    }
    const raw = String(configured).toLowerCase();
    if (raw === "day" || raw === "night") return raw;
  }

  const sunEntity = config.sun_entity || config.sunEntity || config.entities?.sun;
  const sunState = String(stateValue(hass, sunEntity || "sun.sun")).toLowerCase();
  if (sunState === "above_horizon") return "day";
  if (sunState === "below_horizon") return "night";

  const hour = now.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "day" : "night";
}

export function setupBackgroundKey(visible) {
  if (visible.ev && visible.solar && visible.battery) return "full";
  if (visible.ev && visible.solar && !visible.battery) return "ev_solar";
  if (visible.ev && !visible.solar && visible.battery) return "ev_battery";
  if (!visible.ev && visible.solar && visible.battery) return "solar_battery";
  if (visible.ev && !visible.solar && !visible.battery) return "ev_only";
  if (!visible.ev && visible.solar && !visible.battery) return "solar_only";
  if (!visible.ev && !visible.solar && visible.battery) return "battery_only";
  if (!visible.ev && !visible.solar && !visible.battery) return "base";
  return "full";
}

function readBackgroundCandidate(entry, mode) {
  if (!entry) return null;
  if (typeof entry === "string") return { url: entry, fallback: null };
  const modeEntry = entry[mode];
  if (modeEntry && typeof modeEntry === "object") {
    return { url: modeEntry.default || null, fallback: modeEntry.fallback || null };
  }
  return { url: modeEntry || entry.default || null, fallback: entry.fallback || null };
}

function selectBackgroundCandidate(config = {}, visible = {}, mode = "night") {
  const backgrounds = config.backgrounds || DEFAULT_BACKGROUNDS;
  const setupKey = setupBackgroundKey(visible);
  const aliases = {
    full: ["full", "default"],
    ev_solar: ["ev_solar", "evSolar"],
    ev_battery: ["ev_battery", "evBattery"],
    solar_battery: ["solar_battery", "solarBattery", "no_ev", "noEv"],
    ev_only: ["ev_only", "evOnly", "no_solar_battery", "noSolarBattery", "no_solar_no_battery", "noSolarNoBattery"],
    solar_only: ["solar_only", "solarOnly"],
    battery_only: ["battery_only", "batteryOnly"],
    base: ["base", "home_only", "homeOnly", "no_ev_solar_battery", "noEvSolarBattery"],
  };

  for (const key of aliases[setupKey] || [setupKey]) {
    const value = readBackgroundCandidate(backgrounds[key], mode);
    if (value?.url) return value;
  }

  if (setupKey === "solar_battery" && config.background_no_ev) return { url: config.background_no_ev, fallback: null };
  if (setupKey === "full" && config.background_full) return { url: config.background_full, fallback: null };
  if (config.background_full) return { url: config.background_full, fallback: null };
  if (config.background_no_ev) return { url: config.background_no_ev, fallback: null };
  return { url: setupKey === "solar_battery" ? DEFAULT_BACKGROUND_NO_EV : DEFAULT_BACKGROUND_FULL, fallback: null };
}

export function selectBackground(config = {}, visible = {}, mode = "night") {
  return selectBackgroundCandidate(config, visible, mode).url;
}

function statusFromPower(value, positiveStatus, negativeStatus, idleStatus = "idle") {
  const watts = parseNumber(value) ?? 0;
  if (watts > ACTIVE_THRESHOLD_W) return positiveStatus;
  if (watts < -ACTIVE_THRESHOLD_W) return negativeStatus;
  return idleStatus;
}

function flow(name, watts, direction, path, color) {
  const magnitude = Math.abs(watts || 0);
  return {
    name,
    watts,
    active: magnitude > ACTIVE_THRESHOLD_W,
    direction,
    path,
    color,
    speed: flowSpeedSeconds(magnitude),
  };
}

export function buildEnergyModel(config = {}, hass) {
  const entities = config.entities || {};
  const energyToday = config.energy_today || config.energyToday || {};
  const showEv = entityEnabled(config.show_ev, hass, false);
  const showSolar = entityEnabled(config.show_solar, hass, true);
  const showBattery = entityEnabled(config.show_battery, hass, true);

  const gridWatts = parseNumber(stateValue(hass, entities.grid_power)) ?? 0;
  const solarWatts = parseNumber(stateValue(hass, entities.solar_power)) ?? 0;
  const houseWatts = parseNumber(stateValue(hass, entities.house_power)) ?? 0;
  const evWatts = parseNumber(stateValue(hass, entities.ev_power)) ?? 0;
  const batteryWatts = parseNumber(stateValue(hass, entities.battery_power)) ?? 0;
  const batterySoc = stateValue(hass, entities.battery_soc);
  const batteryCapacity = batteryCapacityKwh(config, hass, entities);
  const evSoc = stateValue(hass, entities.ev_soc);
  const solarEfficiency = formatSolarEfficiency(solarWatts, solarCapacityWatts(config, hass, entities));
  const mode = timeOfDay(config, hass, config.now ? new Date(config.now) : new Date());
  const visible = {
    ev: showEv,
    solar: showSolar,
    battery: showBattery,
  };
  const evStatus = normaliseStateLabel(
    stateValue(hass, entities.ev_charging_state),
    statusFromPower(evWatts, "charging", "discharging", "plugged in"),
  );
  const batterySocLabel = formatPercent(batterySoc);
  const batteryCapacityLabel = formatBatteryCapacity(batteryCapacity);
  const labels = configLabels(config);
  const background = selectBackgroundCandidate(config, visible, mode);

  const model = {
    title: config.title || "Energy Flow",
    subtitle: config.subtitle || "Live home power",
    background: background.url,
    backgroundFallback: background.fallback,
    mode,
    entities,
    visible,
    showTitle: entityEnabled(config.show_title ?? config.showTitle, hass, false),
    showDailySummary: entityEnabled(config.show_daily_summary ?? config.showDailySummary, hass, false),
    showStatusBar: entityEnabled(config.show_bottom_bar ?? config.showBottomBar, hass, true),
    nodeDetail: configChoice(config.node_detail ?? config.nodeDetail, ["minimal", "full"], "minimal"),
    size: cardSizeModel(config),
    labels,
    cost: gridCostModel(config, hass, gridWatts),
    actions: buildActions(config, hass),
    grid: {
      label: labels.grid,
      cardLabel: labels.gridCard || labels.grid,
      nodeExtra: nodeExtraLabel(config, hass, "grid"),
      watts: gridWatts,
      powerLabel: formatPower(gridWatts),
      status: statusFromPower(gridWatts, "importing", "exporting"),
      displayStatus: titleCaseLabel(statusFromPower(gridWatts, "importing", "exporting")),
    },
    solar: {
      label: labels.solar,
      nodeExtra: nodeExtraLabel(config, hass, "solar"),
      watts: solarWatts,
      powerLabel: formatPower(solarWatts),
      status: solarWatts > ACTIVE_THRESHOLD_W ? "producing" : "idle",
      displayStatus: titleCaseLabel(solarWatts > ACTIVE_THRESHOLD_W ? "producing" : "idle"),
      efficiencyLabel: solarEfficiency,
      statusLabel: joinLabels([solarWatts > ACTIVE_THRESHOLD_W ? "producing" : "idle", solarEfficiency]),
      displayStatusLabel: titleCaseLabel(joinLabels([solarWatts > ACTIVE_THRESHOLD_W ? "producing" : "idle", solarEfficiency])),
      pillValue: joinLabels([formatPower(solarWatts), solarEfficiency]),
    },
    house: {
      label: labels.house,
      nodeExtra: nodeExtraLabel(config, hass, "house"),
      watts: houseWatts,
      powerLabel: formatPower(houseWatts),
      status: "consuming",
      displayStatus: "Consuming",
    },
    ev: {
      label: labels.ev,
      cardLabel: labels.evCard || labels.ev,
      nodeExtra: nodeExtraLabel(config, hass, "ev"),
      watts: evWatts,
      powerLabel: formatPower(evWatts),
      socLabel: optionalPercent(evSoc) || "-",
      status: evStatus,
      displayStatus: titleCaseLabel(evStatus),
      statusLabel: joinLabels([evStatus, optionalPercent(evSoc)]),
      displayStatusLabel: titleCaseLabel(joinLabels([evStatus, optionalPercent(evSoc)])),
      pillValue: joinLabels([formatPower(evWatts), optionalPercent(evSoc)]),
    },
    battery: {
      label: labels.battery,
      nodeExtra: nodeExtraLabel(config, hass, "battery"),
      watts: batteryWatts,
      powerLabel: formatPower(batteryWatts),
      socLabel: batterySocLabel,
      capacityLabel: batteryCapacityLabel,
      status: statusFromPower(batteryWatts, "charging", "discharging"),
      displayStatus: titleCaseLabel(statusFromPower(batteryWatts, "charging", "discharging")),
      statusLabel: joinLabels([statusFromPower(batteryWatts, "charging", "discharging"), batterySocLabel, batteryCapacityLabel]),
      displayStatusLabel: titleCaseLabel(joinLabels([statusFromPower(batteryWatts, "charging", "discharging"), batterySocLabel, batteryCapacityLabel])),
      pillValue: joinLabels([formatPower(batteryWatts), batterySocLabel]),
    },
    energyToday: {
      grid: formatEnergy(stateValue(hass, energyToday.grid)),
      solar: formatEnergy(stateValue(hass, energyToday.solar)),
      home: formatEnergy(stateValue(hass, energyToday.home)),
    },
    flows: [],
  };
  model.details = buildDetailGroups(config, hass, model, energyToday);
  model.availableBottomCards = [
    ...buildBottomCards(config, hass, model, false),
    customBottomCard({ type: "weather" }, config, hass, model),
    customBottomCard({ type: "battery_discharge" }, config, hass, model),
  ].filter(Boolean);
  model.bottomCards = buildBottomCards(config, hass, model, true);

  // SVG paths are defined in a stable 100x58 viewBox, so the same paths scale cleanly
  // across wall panels, tablets, and fullscreen dashboards.
  model.flows.push(
    flow(
      "grid",
      gridWatts,
      gridWatts >= 0 ? "import" : "export",
      "M 7 30 C 22 28, 30 33, 45 32 S 60 32, 70 30",
      gridWatts >= 0 ? "#4eb4ff" : "#5ef2a1",
    ),
  );
  if (showSolar) {
    model.flows.push(
      flow("solar", solarWatts, "production", "M 63 8 C 59 16, 54 22, 49 29 S 45 36, 39 40", "#ffd15a"),
    );
  }
  if (showEv) {
    model.flows.push(
      flow("ev", evWatts, evWatts >= 0 ? "charging" : "discharging", "M 53 41 C 64 44, 73 45, 86 46", "#4fe9ff"),
    );
  }
  if (showBattery) {
    model.flows.push(
      flow(
        "battery",
        batteryWatts,
        batteryWatts >= 0 ? "charging" : "discharging",
        "M 43 42 C 51 44, 58 45, 66 43",
        "#56f0d0",
      ),
    );
  }

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

class HacsHomeEnergyCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _activeDetail: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      width: min(100%, var(--energy-card-width, 100%));
      min-width: min(100%, var(--energy-card-min-width, 320px));
      max-width: 100%;
      color: var(--energy-card-text, #f7fbff);
      --energy-card-accent: #58d5ff;
      --energy-card-gold: #ffd15a;
      --energy-card-radius: 8px;
      --energy-card-aspect-ratio: 1672 / 941;
      --energy-card-padding: clamp(12px, 3cqw, 34px);
      --energy-card-glass: rgba(4, 12, 18, .58);
      --energy-card-border: rgba(220, 242, 255, .24);
      --energy-card-muted: rgba(232, 245, 255, .72);
      --energy-card-shadow: 0 24px 70px rgba(0, 0, 0, .46);
      font-family: var(--energy-card-font-family, var(--paper-font-body1_-_font-family, Inter, sans-serif));
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

    .scene {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(90deg, rgba(0, 0, 0, .58), rgba(0, 0, 0, .18) 48%, rgba(0, 0, 0, .42)),
        linear-gradient(180deg, rgba(0, 0, 0, .28), rgba(0, 0, 0, .06) 42%, rgba(0, 0, 0, .68)),
        var(--energy-background),
        var(--energy-background-fallback, none);
      background-position: center;
      background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
      filter: saturate(1.08) contrast(1.06);
    }

    .mode-day .scene {
      background-image:
        linear-gradient(90deg, rgba(0, 0, 0, .30), rgba(0, 0, 0, .06) 48%, rgba(0, 0, 0, .24)),
        linear-gradient(180deg, rgba(0, 0, 0, .12), rgba(0, 0, 0, .02) 42%, rgba(0, 0, 0, .42)),
        var(--energy-background),
        var(--energy-background-fallback, none);
      filter: saturate(1.02) contrast(1.02);
    }

    .mode-day .atmosphere {
      background:
        linear-gradient(100deg, rgba(45, 156, 255, .05), transparent 34%),
        radial-gradient(circle at 76% 14%, rgba(255, 222, 145, .10), transparent 24%);
    }

    .atmosphere {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(100deg, rgba(23, 185, 255, .08), transparent 34%),
        radial-gradient(circle at 78% 18%, rgba(255, 209, 90, .16), transparent 28%);
      pointer-events: none;
    }

    .content {
      position: absolute;
      inset: 0;
      z-index: 2;
      padding: var(--energy-card-padding);
      box-sizing: border-box;
    }

    .topbar {
      position: absolute;
      top: var(--energy-card-padding);
      left: var(--energy-card-padding);
      right: var(--energy-card-padding);
      z-index: 3;
      display: grid;
      grid-template-columns: minmax(190px, 1fr);
      gap: clamp(12px, 2vw, 28px);
      align-items: start;
    }

    .topbar.has-summary {
      grid-template-columns: minmax(190px, 1fr) auto;
    }

    .eyebrow,
    .summary-label,
    .node-label,
    .pill-label {
      color: var(--energy-card-muted);
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .eyebrow {
      font-size: clamp(10px, 1.1cqw, 13px);
      line-height: 1.2;
    }

    .title {
      margin-top: 3px;
      font-size: clamp(28px, 5cqw, 58px);
      line-height: .98;
      font-weight: 650;
      text-shadow: 0 0 24px rgba(86, 213, 255, .22), 0 2px 18px rgba(0, 0, 0, .64);
    }

    .summary {
      display: grid;
      grid-auto-flow: column;
      gap: 1px;
      align-items: stretch;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, .18);
      border-radius: 8px;
      background: rgba(255, 255, 255, .09);
      backdrop-filter: blur(16px);
    }

    .summary-item {
      min-width: clamp(86px, 11cqw, 138px);
      padding: 10px 12px;
      background: rgba(3, 12, 18, .46);
    }

    .summary-label {
      font-size: 10px;
    }

    .summary-value {
      margin-top: 4px;
      font-size: clamp(15px, 2cqw, 22px);
      font-weight: 650;
      white-space: nowrap;
    }

    .mid {
      position: absolute;
      inset: 0;
    }

    .node {
      position: absolute;
      z-index: 2;
      display: grid;
      gap: 2px;
      min-width: 88px;
      padding: 7px 9px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .18);
      background: rgba(4, 12, 18, .48);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, .28);
      cursor: pointer;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    .node:hover,
    .pill:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, .38);
      background: rgba(7, 22, 32, .72);
    }

    .node-label {
      font-size: 10px;
    }

    .node-value {
      font-size: clamp(16px, 2.1cqw, 24px);
      line-height: 1;
      font-weight: 700;
      text-shadow: 0 0 18px rgba(86, 213, 255, .24);
      white-space: nowrap;
    }

    .node-status {
      color: var(--energy-card-muted);
      font-size: 12px;
      line-height: 1.2;
    }

    .node-solar {
      top: 31%;
      left: 52%;
      color: #fff2bc;
    }

    .node-grid {
      top: 42%;
      left: 2%;
      color: #d9f2ff;
    }

    .node-house {
      top: 47%;
      left: 42%;
      color: #ffffff;
    }

    .node-ev {
      right: 3%;
      bottom: 26%;
      color: #d9fbff;
    }

    .node-battery {
      top: 58%;
      left: 65%;
      color: #dbfff6;
    }

    .statusbar {
      position: absolute;
      left: var(--energy-card-padding);
      right: var(--energy-card-padding);
      bottom: var(--energy-card-padding);
      z-index: 3;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(138px, 100%), 1fr));
      gap: clamp(8px, 1.6cqw, 16px);
    }

    .pill {
      min-width: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .17);
      background: rgba(5, 14, 20, .66);
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, .28);
      cursor: pointer;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    .pill ha-icon {
      width: 22px;
      height: 22px;
      color: var(--pill-color, var(--energy-card-accent));
      filter: drop-shadow(0 0 12px color-mix(in srgb, var(--pill-color, #58d5ff), transparent 35%));
    }

    .pill-label {
      font-size: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pill-main {
      margin-top: 3px;
      display: grid;
      gap: 1px;
      min-width: 0;
    }

    .pill-status {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: clamp(13px, 1.55cqw, 17px);
      font-weight: 650;
    }

    .pill-value {
      color: #ffffff;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: clamp(12px, 1.25cqw, 15px);
      white-space: nowrap;
    }

    .pill-progress {
      display: block;
      height: 3px;
      margin-top: 8px;
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
    }

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
      animation: detailRise .18s ease both;
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
      text-transform: uppercase;
    }

    .detail-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 3px;
      color: #ffffff;
      font-size: 24px;
      line-height: 1;
      font-weight: 700;
    }

    .detail-title ha-icon {
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
      border-bottom: 1px solid rgba(255, 255, 255, .08);
      color: inherit;
      background: transparent;
      border-left: 0;
      border-right: 0;
      border-top: 0;
      cursor: default;
    }

    .detail-row.has-entity {
      cursor: pointer;
    }

    .detail-row.has-entity:hover {
      color: #ffffff;
    }

    .detail-row:last-child {
      border-bottom: 0;
    }

    .detail-row-label {
      color: var(--energy-card-muted);
      font-size: 13px;
    }

    .detail-row-value {
      color: #ffffff;
      font-size: 15px;
      font-weight: 650;
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
      --action-color: var(--pill-color, var(--energy-card-accent));
    }

    .detail-action:hover {
      border-color: rgba(255, 255, 255, .34);
      background: rgba(255, 255, 255, .10);
    }

    .detail-action ha-icon {
      width: 22px;
      height: 22px;
      color: var(--action-color);
      filter: drop-shadow(0 0 12px color-mix(in srgb, var(--action-color), transparent 35%));
    }

    .detail-action-label {
      max-width: 56px;
      overflow: hidden;
      color: #ffffff;
      font-size: 10px;
      font-weight: 650;
      line-height: 1.12;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .detail-action-state {
      max-width: 56px;
      overflow: hidden;
      color: var(--energy-card-muted);
      font-size: 9px;
      line-height: 1.1;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .detail-action.tone-secure,
    .detail-action.tone-on {
      --action-color: #56f0a8;
    }

    .detail-action.tone-alert {
      --action-color: #ff6b6b;
    }

    .detail-action.tone-off {
      --action-color: #ffb86b;
    }

    @keyframes detailFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes detailRise {
      from {
        opacity: 0;
        transform: translateY(10px) scale(.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 900px) {
      .topbar {
        grid-template-columns: 1fr;
      }

      .summary {
        grid-auto-flow: row;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .statusbar {
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        gap: 6px;
      }

      .node {
        min-width: 82px;
      }

      .pill {
        gap: 6px;
        padding: 7px 8px;
      }

      .pill ha-icon {
        width: 18px;
        height: 18px;
      }

      .pill-label {
        font-size: 8px;
      }

      .pill-main {
        display: grid;
        gap: 1px;
      }

      .pill-status {
        font-size: 12px;
      }

      .pill-value {
        font-size: 11px;
      }
    }

    @media (max-width: 560px) {
      .content {
        --energy-card-padding: 14px;
      }

      .summary {
        display: none;
      }

      .statusbar {
        gap: 4px;
      }

      .pill {
        grid-template-columns: 1fr;
        padding: 4px 5px;
      }

      .pill ha-icon,
      .pill-label,
      .pill-status {
        display: none;
      }

      .pill-value {
        font-size: 10px;
        text-align: center;
      }

      .node {
        min-width: 64px;
        padding: 5px 7px;
      }

      .node-label {
        font-size: 8px;
      }

      .node-value {
        font-size: 15px;
      }

      .node-status {
        display: none;
      }

      .node-solar {
        top: 27%;
        left: 48%;
      }

      .node-house {
        left: 38%;
      }

      .node-battery {
        left: 60%;
      }
    }

    @container (max-width: 620px) {
      .content {
        --energy-card-padding: 14px;
      }

      .topbar,
      .summary {
        display: none;
      }

      .node {
        min-width: 74px;
        padding: 5px 7px;
      }

      .node-label {
        font-size: 8px;
      }

      .node-value {
        font-size: 15px;
      }

      .node-status {
        display: none;
      }

      .node-solar {
        top: 29%;
        left: 53%;
      }

      .node-grid {
        top: 42%;
        left: 4%;
      }

      .node-house {
        top: 47%;
        left: 40%;
      }

      .node-ev {
        right: 4%;
        bottom: 36%;
      }

      .node-battery {
        top: 62%;
        left: 5%;
      }

      .statusbar {
        grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
        gap: 4px;
      }

      .pill {
        grid-template-columns: auto minmax(0, 1fr);
        gap: 5px;
        padding: 5px 6px;
      }

      .pill ha-icon {
        width: 15px;
        height: 15px;
      }

      .pill-label {
        display: none;
      }

      .pill-main {
        display: grid;
        gap: 0;
      }

      .pill-status {
        font-size: 10px;
      }

      .pill-value {
        font-size: 10px;
      }
    }

    @container (max-width: 380px) {
      .content {
        --energy-card-padding: 9px;
      }

      .node {
        min-width: 58px;
        padding: 4px 5px;
      }

      .node-label {
        font-size: 7px;
      }

      .node-value {
        font-size: 12px;
      }

      .node-solar {
        top: 30%;
        left: 52%;
      }

      .node-grid {
        top: 40%;
        left: 3%;
      }

      .node-house {
        top: 46%;
        left: 39%;
      }

      .node-ev {
        right: 3%;
        bottom: 34%;
      }

      .node-battery {
        top: 62%;
        left: 58%;
      }

      .statusbar {
        grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
        gap: 3px;
      }

      .pill {
        display: block;
        padding: 4px;
      }

      .pill ha-icon,
      .pill-status {
        display: none;
      }

      .pill-value {
        display: block;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
      }
    }
  `;

  static getConfigElement() {
    return document.createElement("hacs-home-energy-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Energy Flow",
      subtitle: "Live home power",
      show_ev: true,
      show_solar: true,
      show_battery: true,
      time_of_day: "day",
      solar_capacity_kw: 5,
      show_title: false,
      show_daily_summary: false,
      show_bottom_bar: true,
      node_detail: "minimal",
      entities: {
        sun: "sun.sun",
        grid_power: "sensor.grid_power_w",
        solar_power: "sensor.solar_power_w",
        house_power: "sensor.house_power_w",
        ev_power: "sensor.ev_charging_power_w",
        ev_soc: "sensor.ev_state_of_charge",
        ev_charging_state: "binary_sensor.ev_charging",
        battery_power: "sensor.battery_power_w",
        battery_soc: "sensor.battery_soc",
      },
      energy_today: {
        grid: "sensor.grid_energy_today",
        solar: "sensor.solar_energy_today",
        home: "sensor.home_energy_today",
      },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("hacs-home-energy-card requires a configuration object");
    if (!config.entities || !config.entities.grid_power || !config.entities.house_power) {
      throw new Error("hacs-home-energy-card requires entities.grid_power and entities.house_power");
    }
    this._config = config;
  }

  getCardSize() {
    return 7;
  }

  render() {
    if (!this._config) return html``;
    const model = buildEnergyModel(this._config, this.hass);
    this._model = model;
    this.applySizing(model.size);

    return html`
      <ha-card
        class="mode-${model.mode}"
        style="--energy-background: url('${model.background}'); --energy-background-fallback: ${model.backgroundFallback ? `url('${model.backgroundFallback}')` : "none"}"
      >
        <div class="scene"></div>
        <div class="atmosphere"></div>
        <div class="content">
          ${this.renderTopbar(model)}
          <div class="mid">
            ${this.renderFlows(model)}
            ${model.visible.solar
              ? this.renderNode("solar", model.solar.label, model.solar.powerLabel, model.solar.displayStatusLabel, model.solar.nodeExtra)
              : html``}
            ${this.renderNode("grid", model.grid.label, model.grid.powerLabel, model.grid.displayStatus, model.grid.nodeExtra)}
            ${this.renderNode("house", model.house.label, model.house.powerLabel, model.house.displayStatus, model.house.nodeExtra)}
            ${model.visible.ev
              ? this.renderNode("ev", model.ev.label, model.ev.powerLabel, model.ev.displayStatusLabel, model.ev.nodeExtra)
              : html``}
            ${model.visible.battery
              ? this.renderNode(
                  "battery",
                  model.battery.label,
                  model.battery.powerLabel,
                  model.battery.displayStatusLabel,
                  model.battery.nodeExtra,
                )
              : html``}
          </div>
          ${model.showStatusBar ? this.renderStatusbar(model) : html``}
          ${this.renderDetailPanel(model)}
        </div>
      </ha-card>
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
    if (size?.height) {
      this.style.setProperty("--energy-card-height", size.height);
    } else {
      this.style.removeProperty("--energy-card-height");
    }
  }

  renderTopbar(model) {
    if (!model.showTitle && !model.showDailySummary) return html``;
    return html`
      <div class="topbar ${model.showDailySummary ? "has-summary" : ""}">
        ${model.showTitle
          ? html`
              <div>
                <div class="eyebrow">${model.subtitle}</div>
                <div class="title">${model.title}</div>
              </div>
            `
          : html``}
        ${model.showDailySummary
          ? html`
              <div class="summary" aria-label="Daily energy summary">
                ${this.renderSummaryItem("Grid", model.energyToday.grid)}
                ${model.visible.solar ? this.renderSummaryItem("Solar", model.energyToday.solar) : html``}
                ${this.renderSummaryItem("Home", model.energyToday.home)}
              </div>
            `
          : html``}
      </div>
    `;
  }

  renderSummaryItem(label, value) {
    return html`
      <div class="summary-item">
        <div class="summary-label">${label}</div>
        <div class="summary-value">${value}</div>
      </div>
    `;
  }

  renderFlows(model) {
    return html``;
  }

  renderNode(kind, label, value, status, extra) {
    return html`
      <button class="node node-${kind}" type="button" @click=${() => this.openDetail(kind)} aria-label=${`${label} details`}>
        <span class="node-label">${label}</span>
        <span class="node-value">${value}</span>
        ${this._model?.nodeDetail === "full" ? html`<span class="node-status">${status}</span>` : html``}
        ${extra ? html`<span class="node-status">${extra}</span>` : html``}
      </button>
    `;
  }

  renderStatusbar(model) {
    return html`
      <div class="statusbar">
        ${model.bottomCards.map((card) => this.renderPill(card))}
      </div>
    `;
  }

  renderPill(card) {
    const detailKind = card.detailKind || card.kind;
    return html`
      <button
        class="pill"
        type="button"
        style="--pill-color:${card.color || COLORS.entity}"
        @click=${() => this.openPill(card)}
        aria-label=${`${card.label} details`}
      >
        <ha-icon icon=${card.icon || ICONS.entity}></ha-icon>
        <span>
          <span class="pill-label">${card.label}</span>
          <span class="pill-main">
            <span class="pill-status">${card.status}</span>
            <span class="pill-value">${card.value}</span>
          </span>
          ${card.progress !== null && card.progress !== undefined
            ? html`<span class="pill-progress" title=${card.progressLabel || `${card.progress}%`}><span style=${`--pill-progress:${card.progress}%`}></span></span>`
            : html``}
        </span>
      </button>
    `;
  }

  renderDetailPanel(model) {
    const active = this._activeDetail;
    if (!active || !model.details?.[active]) return html``;
    const labels = {
      grid: [model.grid.cardLabel, model.grid.displayStatus, ICONS.grid, COLORS.grid],
      solar: [model.solar.label, model.solar.displayStatusLabel, ICONS.solar, COLORS.solar],
      house: [model.house.label, model.house.displayStatus, ICONS.house, COLORS.house],
      ev: [model.ev.cardLabel, model.ev.displayStatusLabel, ICONS.ev, COLORS.ev],
      battery: [model.battery.label, model.battery.displayStatusLabel, ICONS.battery, COLORS.battery],
    };
    const [title, status, icon, color] = labels[active] || labels.house;
    const actions = model.actions?.[active] || [];
    return html`
      <div class="detail-backdrop" @click=${(event) => this.closeDetail(event)}>
        <section class="detail-panel" style="--pill-color:${color}" @click=${(event) => event.stopPropagation()}>
          <div class="detail-head">
            <div>
              <div class="detail-label">${status}</div>
              <div class="detail-title"><ha-icon icon=${icon}></ha-icon> ${title}</div>
            </div>
            <button class="detail-close" type="button" @click=${() => this.closeDetail()} aria-label="Close details">×</button>
          </div>
          <div class="detail-body">
            ${model.details[active].map(
              (row) => html`
                <button
                  class="detail-row ${row.entityId ? "has-entity" : ""}"
                  type="button"
                  @click=${() => this.openDetailEntity(row.entityId)}
                >
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

  openDetailEntity(entityId) {
    if (!entityId) return;
    this.openMoreInfo(entityId);
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

const EDITOR_FIELD_DEFS = [
  { name: "title", label: "Title", path: ["title"], selector: { text: {} } },
  { name: "subtitle", label: "Subtitle", path: ["subtitle"], selector: { text: {} } },
  { name: "show_ev", label: "Show EV", path: ["show_ev"], selector: { boolean: {} }, default: true },
  { name: "show_solar", label: "Show Solar", path: ["show_solar"], selector: { boolean: {} }, default: true },
  { name: "show_battery", label: "Show Battery", path: ["show_battery"], selector: { boolean: {} }, default: true },
  { name: "show_title", label: "Show Title", path: ["show_title"], selector: { boolean: {} }, default: false },
  { name: "show_daily_summary", label: "Show Daily Summary", path: ["show_daily_summary"], selector: { boolean: {} }, default: false },
  { name: "show_bottom_bar", label: "Show Bottom Bar", path: ["show_bottom_bar"], selector: { boolean: {} }, default: true },
  {
    name: "node_detail",
    label: "Node Detail",
    path: ["node_detail"],
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "minimal", label: "Minimal" },
          { value: "full", label: "Full" },
        ],
      },
    },
    default: "minimal",
  },
  {
    name: "time_of_day",
    label: "Preview Time Of Day",
    path: ["time_of_day"],
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "auto", label: "Use sun entity" },
          { value: "day", label: "Day" },
          { value: "night", label: "Night" },
        ],
      },
    },
    default: "auto",
    deleteWhen: "auto",
  },
  { name: "solar_capacity_kw", label: "Solar Capacity kW", path: ["solar_capacity_kw"], selector: { number: { min: 0, step: 0.1, mode: "box" } } },
  { name: "battery_capacity_kwh", label: "Battery Capacity kWh", path: ["battery_capacity_kwh"], selector: { number: { min: 0, step: 0.1, mode: "box" } } },
  { name: "card_width", label: "Card Width px", path: ["card_width"], selector: { number: { min: 320, step: 1, mode: "box" } } },
  { name: "card_height", label: "Card Height px", path: ["card_height"], selector: { number: { min: 180, step: 1, mode: "box" } } },
  { name: "grid_label", label: "Grid Label", path: ["labels", "grid"], selector: { text: {} } },
  { name: "house_label", label: "Home Label", path: ["labels", "house"], selector: { text: {} } },
  { name: "solar_label", label: "Solar Label", path: ["labels", "solar"], selector: { text: {} } },
  { name: "ev_label", label: "EV Label", path: ["labels", "ev"], selector: { text: {} } },
  { name: "battery_label", label: "Battery Label", path: ["labels", "battery"], selector: { text: {} } },
  { name: "sun", label: "Sun Entity", path: ["entities", "sun"], selector: { entity: { domain: "sun" } } },
  { name: "weather", label: "Weather Entity", path: ["entities", "weather"], selector: { entity: { domain: "weather" } } },
  { name: "outdoor_temperature", label: "Outdoor Temperature", path: ["entities", "outdoor_temperature"], selector: { entity: { domain: "sensor" } } },
  { name: "grid_power", label: "Grid Import Export Power", path: ["entities", "grid_power"], selector: { entity: { domain: "sensor" } } },
  { name: "house_power", label: "Home Power Usage", path: ["entities", "house_power"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_power", label: "Solar Producing Power", path: ["entities", "solar_power"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_capacity", label: "Solar Capacity Entity", path: ["entities", "solar_capacity"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_power", label: "Battery Charge Discharge Power", path: ["entities", "battery_power"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_soc", label: "Battery State Of Charge", path: ["entities", "battery_soc"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_capacity", label: "Battery Capacity Entity", path: ["entities", "battery_capacity"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_power", label: "EV Charge Power", path: ["entities", "ev_power"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_soc", label: "EV State Of Charge", path: ["entities", "ev_soc"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_charging_state", label: "EV Charging State", path: ["entities", "ev_charging_state"], selector: { entity: { domain: ["binary_sensor", "sensor"] } } },
  { name: "grid_energy_today", label: "Grid Energy Today", path: ["energy_today", "grid"], selector: { entity: { domain: "sensor" } } },
  { name: "grid_import_today", label: "Grid Import Today", path: ["energy_today", "grid_import"], selector: { entity: { domain: "sensor" } } },
  { name: "grid_export_today", label: "Grid Export Today", path: ["energy_today", "grid_export"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_energy_today", label: "Solar Energy Today", path: ["energy_today", "solar"], selector: { entity: { domain: "sensor" } } },
  { name: "home_energy_today", label: "Home Energy Today", path: ["energy_today", "home"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_discharge_today", label: "Battery Discharge Today", path: ["energy_today", "battery_discharge"], selector: { entity: { domain: "sensor" } } },
  { name: "grid_node_extra", label: "Grid Node Extra", path: ["node_info", "grid", "entity"], selector: { entity: { domain: "sensor" } } },
  { name: "home_node_extra", label: "Home Node Extra", path: ["node_info", "house", "entity"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_node_extra", label: "Solar Node Extra", path: ["node_info", "solar", "entity"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_node_extra", label: "EV Node Extra", path: ["node_info", "ev", "entity"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_node_extra", label: "Battery Node Extra", path: ["node_info", "battery", "entity"], selector: { entity: { domain: "sensor" } } },
  { name: "import_rate", label: "Import Rate", path: ["tariffs", "import_rate"], selector: { number: { min: 0, step: 0.001, mode: "box" } } },
  { name: "export_rate", label: "Export Rate", path: ["tariffs", "export_rate"], selector: { number: { min: 0, step: 0.001, mode: "box" } } },
  { name: "import_rate_entity", label: "Import Rate Entity", path: ["tariffs", "import_rate_entity"], selector: { entity: { domain: "sensor" } } },
  { name: "export_rate_entity", label: "Export Rate Entity", path: ["tariffs", "export_rate_entity"], selector: { entity: { domain: "sensor" } } },
  { name: "currency", label: "Currency", path: ["tariffs", "currency"], selector: { text: {} } },
  { name: "cost_today_entity", label: "Cost Today Entity", path: ["costs", "today_entity"], selector: { entity: { domain: "sensor" } } },
  { name: "cost_daily_budget", label: "Daily Cost Budget", path: ["costs", "daily_budget"], selector: { number: { min: 0, step: 0.01, mode: "box" } } },
  { name: "solar_pv_voltage", label: "Solar PV Voltage", path: ["detail_entities", "solar", "pv_voltage"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_pv_current", label: "Solar PV Current", path: ["detail_entities", "solar", "pv_current"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_energy_24h", label: "Solar Energy 24h", path: ["detail_entities", "solar", "energy_24h"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_energy_week", label: "Solar Energy Week", path: ["detail_entities", "solar", "energy_week"], selector: { entity: { domain: "sensor" } } },
  { name: "solar_energy_month", label: "Solar Energy Month", path: ["detail_entities", "solar", "energy_month"], selector: { entity: { domain: "sensor" } } },
  { name: "grid_import_24h", label: "Grid Import 24h", path: ["detail_entities", "grid", "import_24h"], selector: { entity: { domain: "sensor" } } },
  { name: "grid_export_24h", label: "Grid Export 24h", path: ["detail_entities", "grid", "export_24h"], selector: { entity: { domain: "sensor" } } },
  { name: "home_energy_24h", label: "Home Energy 24h", path: ["detail_entities", "house", "energy_24h"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_range", label: "EV Range", path: ["detail_entities", "ev", "range"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_inside_temperature", label: "EV Inside Temperature", path: ["detail_entities", "ev", "inside_temperature"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_odometer", label: "EV Odometer", path: ["detail_entities", "ev", "odometer"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_energy_24h", label: "EV Energy 24h", path: ["detail_entities", "ev", "energy_24h"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_energy_week", label: "EV Energy Week", path: ["detail_entities", "ev", "energy_week"], selector: { entity: { domain: "sensor" } } },
  { name: "ev_lock", label: "EV Lock Control", path: ["detail_entities", "ev", "lock"], selector: { entity: { domain: "lock" } } },
  { name: "ev_boost", label: "EV Boost Switch", path: ["detail_entities", "ev", "boost", "entity"], selector: { entity: { domain: "switch" } } },
  { name: "battery_voltage", label: "Battery Voltage", path: ["detail_entities", "battery", "voltage"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_current", label: "Battery Current", path: ["detail_entities", "battery", "current"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_charge_24h", label: "Battery Charge 24h", path: ["detail_entities", "battery", "charge_24h"], selector: { entity: { domain: "sensor" } } },
  { name: "battery_discharge_24h", label: "Battery Discharge 24h", path: ["detail_entities", "battery", "discharge_24h"], selector: { entity: { domain: "sensor" } } },
  ...Array.from({ length: MAX_BOTTOM_CARDS }, (_, index) => ({
    name: `bottom_bar_slot_${index + 1}`,
    label: `Bottom Bar Slot ${index + 1}`,
    bottomSlot: index,
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "none", label: "None" },
          { value: "cost_today", label: "Cost Today" },
          { value: "cost_now", label: "Cost Now" },
          { value: "self_powered_today", label: "Self Powered Today" },
          { value: "grid_import_export", label: "Grid Import Export" },
          { value: "battery_reserve", label: "Battery Reserve" },
          { value: "battery_discharge", label: "Battery Discharge Today" },
          { value: "sun", label: "Sun State" },
          { value: "weather", label: "Weather Temperature" },
        ],
      },
    },
    default: index === 0 ? "cost_today" : index === 1 ? "self_powered_today" : index === 2 ? "grid_import_export" : index === 3 ? "battery_reserve" : "sun",
  })),
];

const EDITOR_SECTION_GROUPS = [
  {
    label: "Card",
    fields: [
      "title",
      "subtitle",
      "show_ev",
      "show_solar",
      "show_battery",
      "show_title",
      "show_daily_summary",
      "show_bottom_bar",
      "node_detail",
      "time_of_day",
      "card_width",
      "card_height",
    ],
  },
  {
    label: "Grid And Home",
    fields: [
      "sun",
      "weather",
      "outdoor_temperature",
      "grid_label",
      "house_label",
      "grid_power",
      "house_power",
      "grid_energy_today",
      "grid_import_today",
      "grid_export_today",
      "home_energy_today",
      "grid_node_extra",
      "home_node_extra",
      "grid_import_24h",
      "grid_export_24h",
      "home_energy_24h",
    ],
  },
  {
    label: "Solar",
    fields: [
      "solar_label",
      "solar_capacity_kw",
      "solar_power",
      "solar_capacity",
      "solar_energy_today",
      "solar_node_extra",
      "solar_pv_voltage",
      "solar_pv_current",
      "solar_energy_24h",
      "solar_energy_week",
      "solar_energy_month",
    ],
  },
  {
    label: "EV",
    fields: [
      "ev_label",
      "ev_power",
      "ev_soc",
      "ev_charging_state",
      "ev_node_extra",
      "ev_range",
      "ev_inside_temperature",
      "ev_odometer",
      "ev_energy_24h",
      "ev_energy_week",
      "ev_lock",
      "ev_boost",
    ],
  },
  {
    label: "Battery",
    fields: [
      "battery_label",
      "battery_capacity_kwh",
      "battery_power",
      "battery_soc",
      "battery_capacity",
      "battery_node_extra",
      "battery_discharge_today",
      "battery_voltage",
      "battery_current",
      "battery_charge_24h",
      "battery_discharge_24h",
    ],
  },
  {
    label: "Cost",
    fields: ["import_rate", "export_rate", "import_rate_entity", "export_rate_entity", "currency", "cost_today_entity", "cost_daily_budget"],
  },
  {
    label: "Bottom Bar",
    fields: ["bottom_bar_slot_1", "bottom_bar_slot_2", "bottom_bar_slot_3", "bottom_bar_slot_4", "bottom_bar_slot_5"],
  },
];

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

function editorDataFromConfig(config) {
  const data = {};
  for (const field of EDITOR_FIELD_DEFS) {
    if (field.bottomSlot !== undefined) {
      const configured = configuredBottomBar(config);
      const item = configured?.[field.bottomSlot];
      const type = typeof item === "string" ? item : item?.type;
      data[field.name] = type || field.default || "none";
      continue;
    }
    const value = readConfigPath(config, field.path);
    if (value !== undefined && value !== null) data[field.name] = value;
    else if (field.default !== undefined) data[field.name] = field.default;
  }
  return data;
}

const EDITOR_SYSTEM_TOGGLES = {
  solar: "show_solar",
  ev: "show_ev",
  battery: "show_battery",
};

function editorSystemForField(field) {
  if (!field.path) return null;
  if (Object.values(EDITOR_SYSTEM_TOGGLES).includes(field.name)) return null;
  if (field.system) return field.system;
  for (const system of Object.keys(EDITOR_SYSTEM_TOGGLES)) {
    if (field.name.startsWith(`${system}_`) || field.path.includes(system)) return system;
  }
  return null;
}

function editorSystemVisible(data, system) {
  if (!system) return true;
  return data[EDITOR_SYSTEM_TOGGLES[system]] !== false;
}

function editorFieldsForConfig(config, start = 0, end = EDITOR_FIELD_DEFS.length) {
  const data = editorDataFromConfig(config);
  return EDITOR_FIELD_DEFS.slice(start, end).filter((field) => editorSystemVisible(data, editorSystemForField(field)));
}

function editorFieldByName(name) {
  return EDITOR_FIELD_DEFS.find((field) => field.name === name);
}

function editorSectionsForConfig(config) {
  const data = editorDataFromConfig(config);
  return EDITOR_SECTION_GROUPS.map((section) => ({
    label: section.label,
    fields: section.fields
      .map(editorFieldByName)
      .filter(Boolean)
      .filter((field) => editorSystemVisible(data, editorSystemForField(field))),
  })).filter((section) => section.fields.length);
}

function editorDataToConfig(previousConfig, data) {
  const config = cloneConfigForEditor(previousConfig);
  for (const field of EDITOR_FIELD_DEFS) {
    if (field.bottomSlot !== undefined) continue;
    const value = data[field.name];
    const empty = value === "" || value === undefined || value === null || value === field.deleteWhen;
    if (empty) {
      deleteConfigPath(config, field.path);
      continue;
    }
    writeConfigPath(config, field.path, value);
  }
  const bottomSlotFields = EDITOR_FIELD_DEFS.filter((field) => field.bottomSlot !== undefined);
  if (bottomSlotFields.some((field) => Object.hasOwn(data, field.name))) {
    const previousItems = configuredBottomBar(previousConfig) || [];
    const nextItems = bottomSlotFields
      .map((field) => {
        const type = data[field.name] || "none";
        if (type === "none") return null;
        const previous = previousItems[field.bottomSlot];
        const base = previous && typeof previous === "object" ? { ...previous } : {};
        return { ...base, type };
      })
      .filter(Boolean);
    if (nextItems.length) config.bottom_bar = nextItems;
    else deleteConfigPath(config, ["bottom_bar"]);
  }
  return config;
}

class HacsHomeEnergyCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = css`
    .editor {
      display: grid;
      gap: 18px;
    }

    .section-title {
      margin: 4px 0 8px;
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    ha-form {
      width: 100%;
    }
  `;

  setConfig(config) {
    this._config = config || {};
  }

  render() {
    return html`
      <div class="editor">
        ${editorSectionsForConfig(this._config).map((section) => this.renderSection(section))}
      </div>
    `;
  }

  renderSection(section) {
    const fields = section.fields;
    return html`
      <section>
        <div class="section-title">${section.label}</div>
        <ha-form
          .hass=${this.hass}
          .data=${editorDataFromConfig(this._config)}
          .schema=${fields.map(({ name, selector }) => ({ name, selector }))}
          .computeLabel=${this.computeLabel}
          @value-changed=${this.valueChanged}
        ></ha-form>
      </section>
    `;
  }

  computeLabel(schema) {
    return EDITOR_FIELD_DEFS.find((field) => field.name === schema.name)?.label || schema.name;
  }

  valueChanged(event) {
    const data = { ...editorDataFromConfig(this._config), ...(event.detail.value || {}) };
    const config = editorDataToConfig(this._config, data);
    this._config = config;
    fireEvent(this, "config-changed", { config });
  }
}

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
  if (existingEntryIndex === -1) {
    window.customCards.push(cardPickerEntry);
  } else {
    window.customCards[existingEntryIndex] = { ...window.customCards[existingEntryIndex], ...cardPickerEntry };
  }
}

export { HacsHomeEnergyCard, editorDataFromConfig, editorDataToConfig, editorFieldsForConfig, editorSectionsForConfig };
