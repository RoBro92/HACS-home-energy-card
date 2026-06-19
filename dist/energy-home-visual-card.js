const litRuntime = await resolveLitRuntime();
const { LitElement, html, css } = litRuntime;

const DEFAULT_BACKGROUND_FULL = "/local/energy-bg-full.jpg";
const DEFAULT_BACKGROUND_NO_EV = "/local/energy-bg-no-ev.jpg";
const MODULE_BASE_URL = new URL(".", import.meta.url);
const ACTIVE_THRESHOLD_W = 25;
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 19;

function moduleAsset(path) {
  return new URL(path, MODULE_BASE_URL).href;
}

const DEFAULT_BACKGROUNDS = {
  full: {
    day: moduleAsset("energy-bg-full-day.png"),
    night: moduleAsset("energy-bg-full-night.png"),
  },
  ev_solar: {
    day: moduleAsset("energy-bg-ev-solar-day.png"),
    night: moduleAsset("energy-bg-ev-solar-night.png"),
  },
  ev_battery: {
    day: moduleAsset("energy-bg-ev-battery-day.png"),
    night: moduleAsset("energy-bg-ev-battery-night.png"),
  },
  solar_battery: {
    day: moduleAsset("energy-bg-no-ev-day.png"),
    night: moduleAsset("energy-bg-no-ev-night.png"),
  },
  ev_only: {
    day: moduleAsset("energy-bg-no-solar-battery-day.png"),
    night: moduleAsset("energy-bg-no-solar-battery-night.png"),
  },
  solar_only: {
    day: moduleAsset("energy-bg-solar-only-day.png"),
    night: moduleAsset("energy-bg-solar-only-night.png"),
  },
  battery_only: {
    day: moduleAsset("energy-bg-battery-only-day.png"),
    night: moduleAsset("energy-bg-battery-only-night.png"),
  },
  base: {
    day: moduleAsset("energy-bg-base-day.png"),
    night: moduleAsset("energy-bg-base-night.png"),
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
  solar: "mdi:solar-power-variant",
  house: "mdi:home",
  ev: "mdi:car-electric",
  battery: "mdi:home-battery",
  sun: "mdi:weather-sunset",
  entity: "mdi:information-outline",
};

const COLORS = {
  grid: "#58bfff",
  cost: "#8ee6a5",
  solar: "#ffd15a",
  house: "#ffffff",
  ev: "#50eaff",
  battery: "#56f0d0",
  sun: "#ffb86b",
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
  };
}

function buildActions(config) {
  const actions = config.actions || config.quick_actions || config.quickActions || {};
  return Object.fromEntries(
    ["grid", "solar", "house", "ev", "battery"].map((key) => [
      key,
      (Array.isArray(actions[key]) ? actions[key] : []).map(normaliseAction).filter(Boolean),
    ]),
  );
}

function predefinedBottomCard(type, model) {
  const cards = {
    grid: {
      kind: "grid",
      label: model.grid.cardLabel,
      status: model.grid.displayStatus,
      value: model.grid.powerLabel,
      icon: ICONS.grid,
      color: COLORS.grid,
    },
    cost: {
      kind: "cost",
      label: "Grid cost",
      status: model.cost.displayStatus,
      value: model.cost.valueLabel,
      icon: ICONS.cost,
      color: COLORS.cost,
      detailKind: "grid",
    },
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
  return cards[type] || null;
}

function customBottomCard(item, config, hass, model) {
  const type = typeof item === "string" ? item : item?.type;
  if (!type) return null;
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
  const card = predefinedBottomCard(type, model);
  if (!card) return null;
  return typeof item === "object"
    ? {
        ...card,
        label: item.label || card.label,
        status: item.status || card.status,
        icon: item.icon || card.icon,
        color: item.color || card.color,
      }
    : card;
}

function buildBottomCards(config, hass, model) {
  const configured = config.bottom_bar || config.bottomBar;
  if (Array.isArray(configured) && configured.length) {
    return configured.map((item) => customBottomCard(item, config, hass, model)).filter(Boolean);
  }
  return [
    predefinedBottomCard("grid", model),
    model.visible.solar ? predefinedBottomCard("solar", model) : null,
    model.visible.ev ? predefinedBottomCard("ev", model) : null,
    model.visible.battery ? predefinedBottomCard("battery", model) : null,
  ].filter(Boolean);
}

function labelFromDetailKey(key) {
  if (DETAIL_LABELS[key]) return DETAIL_LABELS[key];
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function configuredDetailRows(config, hass, group) {
  const detailEntities = config.detail_entities || config.detailEntities || {};
  return Object.entries(detailEntities[group] || {})
    .map(([key, entityId]) => detailRow(labelFromDetailKey(key), entityDisplayValue(hass, entityId), entityId))
    .filter(Boolean);
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

function readBackgroundValue(entry, mode) {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  const modeEntry = entry[mode];
  if (modeEntry && typeof modeEntry === "object") {
    return modeEntry.default || null;
  }
  return modeEntry || entry.default || null;
}

export function selectBackground(config = {}, visible = {}, mode = "night") {
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
    const value = readBackgroundValue(backgrounds[key], mode);
    if (value) return value;
  }

  if (setupKey === "solar_battery" && config.background_no_ev) return config.background_no_ev;
  if (setupKey === "full" && config.background_full) return config.background_full;
  if (config.background_full) return config.background_full;
  if (config.background_no_ev) return config.background_no_ev;
  return setupKey === "solar_battery" ? DEFAULT_BACKGROUND_NO_EV : DEFAULT_BACKGROUND_FULL;
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

  const model = {
    title: config.title || "Energy Flow",
    subtitle: config.subtitle || "Live home power",
    background: selectBackground(config, visible, mode),
    mode,
    entities,
    visible,
    showTitle: entityEnabled(config.show_title ?? config.showTitle, hass, false),
    showDailySummary: entityEnabled(config.show_daily_summary ?? config.showDailySummary, hass, false),
    showStatusBar: entityEnabled(config.show_bottom_bar ?? config.showBottomBar, hass, true),
    nodeDetail: configChoice(config.node_detail ?? config.nodeDetail, ["minimal", "full"], "minimal"),
    labels,
    cost: gridCostModel(config, hass, gridWatts),
    actions: buildActions(config),
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
  model.bottomCards = buildBottomCards(config, hass, model);

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

class EnergyHomeVisualCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _activeDetail: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--energy-card-text, #f7fbff);
      --energy-card-accent: #58d5ff;
      --energy-card-gold: #ffd15a;
      --energy-card-radius: 8px;
      --energy-card-aspect-ratio: 1672 / 941;
      --energy-card-padding: clamp(16px, 2.4vw, 34px);
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
      aspect-ratio: var(--energy-card-aspect-ratio);
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
        var(--energy-background);
      background-position: center;
      background-size: 100% 100%, 100% 100%, 100% 100%;
      filter: saturate(1.08) contrast(1.06);
    }

    .mode-day .scene {
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
      font-size: clamp(10px, 1vw, 13px);
      line-height: 1.2;
    }

    .title {
      margin-top: 3px;
      font-size: clamp(28px, 4vw, 58px);
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
      min-width: clamp(86px, 8.8vw, 138px);
      padding: 10px 12px;
      background: rgba(3, 12, 18, .46);
    }

    .summary-label {
      font-size: 10px;
    }

    .summary-value {
      margin-top: 4px;
      font-size: clamp(15px, 1.5vw, 22px);
      font-weight: 650;
      white-space: nowrap;
    }

    .mid {
      position: absolute;
      inset: 0;
    }

    .flows {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      filter: drop-shadow(0 0 10px rgba(92, 226, 255, .34));
      pointer-events: none;
    }

    .flow-base {
      fill: none;
      stroke: rgba(230, 247, 255, .18);
      stroke-width: 1.2;
    }

    .flow-line {
      fill: none;
      stroke: var(--flow-color);
      stroke-width: 1.65;
      stroke-linecap: round;
      stroke-dasharray: 1.2 6;
      animation: flow var(--flow-speed, 4s) linear infinite;
      opacity: .95;
    }

    .flow-line.is-idle {
      animation: none;
      opacity: .18;
      stroke-dasharray: 1 9;
    }

    .flow-line.is-reverse {
      animation-direction: reverse;
    }

    @keyframes flow {
      to {
        stroke-dashoffset: -42;
      }
    }

    .flow-particle {
      fill: var(--flow-color);
      opacity: .92;
      filter: drop-shadow(0 0 7px var(--flow-color));
    }

    .node {
      position: absolute;
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
      font-size: clamp(16px, 1.65vw, 24px);
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
      grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
      gap: clamp(8px, 1.3vw, 16px);
    }

    .pill {
      min-width: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      align-items: center;
      padding: 12px 14px;
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
      display: flex;
      gap: 8px;
      align-items: baseline;
      justify-content: space-between;
      min-width: 0;
    }

    .pill-status {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: clamp(14px, 1.2vw, 18px);
      font-weight: 650;
    }

    .pill-value {
      color: #ffffff;
      font-size: clamp(13px, 1vw, 16px);
      white-space: nowrap;
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
      margin-top: 3px;
      font-size: 24px;
      line-height: 1;
      font-weight: 700;
    }

    .detail-close {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, .16);
      border-radius: 8px;
      background: rgba(255, 255, 255, .06);
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
      font-size: 15px;
      font-weight: 650;
      white-space: nowrap;
    }

    .detail-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, .10);
    }

    .detail-action {
      display: inline-grid;
      grid-template-columns: auto 1fr;
      gap: 7px;
      align-items: center;
      min-height: 34px;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .16);
      background: rgba(255, 255, 255, .06);
      cursor: pointer;
    }

    .detail-action:hover {
      border-color: rgba(255, 255, 255, .34);
      background: rgba(255, 255, 255, .10);
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
  `;

  static getConfigElement() {
    return document.createElement("energy-home-visual-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Energy Flow",
      subtitle: "Live home power",
      show_ev: false,
      show_solar: true,
      show_battery: true,
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
    if (!config) throw new Error("energy-home-visual-card requires a configuration object");
    if (!config.entities || !config.entities.grid_power || !config.entities.house_power) {
      throw new Error("energy-home-visual-card requires entities.grid_power and entities.house_power");
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

    return html`
      <ha-card class="mode-${model.mode}" style="--energy-background: url('${model.background}')">
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
    // Each flow path is drawn twice: a faint static base line and a dashed glowing line.
    // The glowing line animates stroke-dashoffset; the duration is derived from watts,
    // and export/discharge flows reverse the animation direction.
    return html`
      <svg class="flows" viewBox="0 0 100 58" preserveAspectRatio="none" aria-hidden="true">
        ${model.flows.map((item) => {
          const reversed = item.direction === "export" || item.direction === "discharging";
          return html`
            <path class="flow-base" d=${item.path}></path>
            <path
              class="flow-line ${item.active ? "" : "is-idle"} ${reversed ? "is-reverse" : ""}"
              style="--flow-color:${item.color}; --flow-speed:${item.speed || 8}s"
              d=${item.path}
            ></path>
            ${item.active
              ? html`
                  <circle class="flow-particle" r="0.72" style="--flow-color:${item.color}">
                    <animateMotion
                      dur=${`${Math.max(1.6, item.speed || 4)}s`}
                      repeatCount="indefinite"
                      path=${item.path}
                      keyPoints=${reversed ? "1;0" : "0;1"}
                      keyTimes="0;1"
                      calcMode="linear"
                    ></animateMotion>
                  </circle>
                  <circle class="flow-particle" r="0.48" style="--flow-color:${item.color}; opacity:.58">
                    <animateMotion
                      dur=${`${Math.max(1.6, item.speed || 4)}s`}
                      begin="-0.8s"
                      repeatCount="indefinite"
                      path=${item.path}
                      keyPoints=${reversed ? "1;0" : "0;1"}
                      keyTimes="0;1"
                      calcMode="linear"
                    ></animateMotion>
                  </circle>
                `
              : html``}
          `;
        })}
      </svg>
    `;
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
                        <button class="detail-action" type="button" @click=${() => this.callQuickAction(action)}>
                          <ha-icon icon=${action.icon}></ha-icon>
                          <span>${action.label}</span>
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
    if (card.entityId) {
      this.openMoreInfo(card.entityId);
      return;
    }
    this.openDetail(card.detailKind || card.kind);
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

const EDITOR_FIELDS = [
  ["Title", ["title"], "Energy Flow"],
  ["Subtitle", ["subtitle"], "Live home power"],
  ["Show EV", ["show_ev"], "true, false, or input_boolean.has_ev"],
  ["Show Solar", ["show_solar"], "true, false, or input_boolean.has_solar"],
  ["Show Battery", ["show_battery"], "true, false, or input_boolean.has_battery"],
  ["Solar Capacity (kW)", ["solar_capacity_kw"], "5"],
  ["Battery Capacity (kWh)", ["battery_capacity_kwh"], "13.5"],
  ["Show Title", ["show_title"], "false"],
  ["Show Daily Summary", ["show_daily_summary"], "false"],
  ["Show Bottom Bar", ["show_bottom_bar"], "true"],
  ["Node Detail", ["node_detail"], "minimal or full"],
  ["Grid Label", ["labels", "grid"], "Grid"],
  ["Grid Bottom Label", ["labels", "gridCard"], "Electricity"],
  ["Home Label", ["labels", "house"], "Home"],
  ["Solar Label", ["labels", "solar"], "Solar"],
  ["EV Label", ["labels", "ev"], "EV"],
  ["EV Bottom Label", ["labels", "evCard"], "Electric Vehicle"],
  ["Battery Label", ["labels", "battery"], "Battery"],
  ["Import Rate", ["tariffs", "import_rate"], "0.34"],
  ["Export Rate", ["tariffs", "export_rate"], "0.15"],
  ["Import Rate Entity", ["tariffs", "import_rate_entity"], "sensor.current_import_rate"],
  ["Export Rate Entity", ["tariffs", "export_rate_entity"], "sensor.current_export_rate"],
  ["Currency", ["tariffs", "currency"], "£"],
  ["Sun / Day-Night Entity", ["entities", "sun"], "sun.sun"],
  ["Grid Import/Export Power", ["entities", "grid_power"], "sensor.grid_power_w"],
  ["Home Power Usage", ["entities", "house_power"], "sensor.house_consumption_w"],
  ["Solar Producing Power", ["entities", "solar_power"], "sensor.solar_power_w"],
  ["Solar Capacity Entity", ["entities", "solar_capacity"], "sensor.solar_capacity_kw"],
  ["Battery Charge/Discharge Power", ["entities", "battery_power"], "sensor.battery_power_w"],
  ["Battery State of Charge", ["entities", "battery_soc"], "sensor.battery_soc"],
  ["Battery Capacity Entity", ["entities", "battery_capacity"], "sensor.battery_capacity_kwh"],
  ["EV Charge Power", ["entities", "ev_power"], "sensor.ev_charging_power_w"],
  ["EV State of Charge", ["entities", "ev_soc"], "sensor.ev_state_of_charge"],
  ["EV Charging State", ["entities", "ev_charging_state"], "binary_sensor.ev_charging"],
  ["Grid Energy Today", ["energy_today", "grid"], "sensor.grid_energy_today"],
  ["Solar Energy Today", ["energy_today", "solar"], "sensor.solar_energy_today"],
  ["Home Energy Today", ["energy_today", "home"], "sensor.home_energy_today"],
  ["Grid Node Extra", ["node_info", "grid", "entity"], "sensor.grid_voltage"],
  ["Home Node Extra", ["node_info", "house", "entity"], "sensor.home_temperature"],
  ["Solar Node Extra", ["node_info", "solar", "entity"], "sensor.solar_efficiency"],
  ["EV Node Extra", ["node_info", "ev", "entity"], "sensor.ev_range"],
  ["Battery Node Extra", ["node_info", "battery", "entity"], "sensor.battery_temperature"],
  ["Solar PV Voltage", ["detail_entities", "solar", "pv_voltage"], "sensor.solar_pv_voltage"],
  ["Solar PV Current", ["detail_entities", "solar", "pv_current"], "sensor.solar_pv_current"],
  ["Solar Energy 24h", ["detail_entities", "solar", "energy_24h"], "sensor.solar_energy_24h"],
  ["Solar Energy Week", ["detail_entities", "solar", "energy_week"], "sensor.solar_energy_week"],
  ["Solar Energy Month", ["detail_entities", "solar", "energy_month"], "sensor.solar_energy_month"],
  ["Grid Import 24h", ["detail_entities", "grid", "import_24h"], "sensor.grid_import_24h"],
  ["Grid Export 24h", ["detail_entities", "grid", "export_24h"], "sensor.grid_export_24h"],
  ["Home Energy 24h", ["detail_entities", "house", "energy_24h"], "sensor.home_energy_24h"],
  ["EV Energy 24h", ["detail_entities", "ev", "energy_24h"], "sensor.ev_energy_24h"],
  ["EV Energy Week", ["detail_entities", "ev", "energy_week"], "sensor.ev_energy_week"],
  ["Battery Voltage", ["detail_entities", "battery", "voltage"], "sensor.battery_voltage"],
  ["Battery Current", ["detail_entities", "battery", "current"], "sensor.battery_current"],
  ["Battery Charge 24h", ["detail_entities", "battery", "charge_24h"], "sensor.battery_charge_24h"],
  ["Battery Discharge 24h", ["detail_entities", "battery", "discharge_24h"], "sensor.battery_discharge_24h"],
];

class EnergyHomeVisualCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = css`
    .editor {
      display: grid;
      gap: 14px;
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }

    .section-title {
      margin-top: 6px;
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    ha-textfield {
      width: 100%;
    }
  `;

  setConfig(config) {
    this._config = config || {};
  }

  render() {
    return html`
      <div class="editor">
        <div class="section-title">Card</div>
        <div class="field-grid">
          ${EDITOR_FIELDS.slice(0, 23).map(([label, path, placeholder]) => this.renderField(label, path, placeholder))}
        </div>
        <div class="section-title">Sensors</div>
        <div class="field-grid">
          ${EDITOR_FIELDS.slice(23, 42).map(([label, path, placeholder]) => this.renderField(label, path, placeholder))}
        </div>
        <div class="section-title">Detail Sensors</div>
        <div class="field-grid">
          ${EDITOR_FIELDS.slice(42).map(([label, path, placeholder]) => this.renderField(label, path, placeholder))}
        </div>
      </div>
    `;
  }

  renderField(label, path, placeholder) {
    return html`
      <ha-textfield
        label=${label}
        .value=${this.readPath(path)}
        placeholder=${placeholder}
        @input=${(event) => this.updatePath(path, event.target.value)}
      ></ha-textfield>
    `;
  }

  readPath(path) {
    let value = this._config || {};
    for (const key of path) {
      value = value?.[key];
    }
    return value ?? "";
  }

  updatePath(path, value) {
    const config = {
      ...(this._config || {}),
      entities: { ...(this._config?.entities || {}) },
      energy_today: { ...(this._config?.energy_today || this._config?.energyToday || {}) },
    };
    let target = config;
    for (const key of path.slice(0, -1)) {
      target[key] = { ...(target[key] || {}) };
      target = target[key];
    }

    const key = path[path.length - 1];
    const trimmed = String(value ?? "").trim();
    if (trimmed) target[key] = trimmed;
    else delete target[key];

    this._config = config;
    fireEvent(this, "config-changed", { config });
  }
}

if (typeof customElements !== "undefined" && !customElements.get("energy-home-visual-card")) {
  customElements.define("energy-home-visual-card", EnergyHomeVisualCard);
}

if (typeof customElements !== "undefined" && !customElements.get("energy-home-visual-card-editor")) {
  customElements.define("energy-home-visual-card-editor", EnergyHomeVisualCardEditor);
}

if (typeof window !== "undefined") {
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "energy-home-visual-card",
    name: "Energy Home Visual Card",
    description: "Cinematic animated energy flow visualisation for Home Assistant.",
  });
}

export { EnergyHomeVisualCard };
