const litRuntime = await resolveLitRuntime();
const { LitElement, html, css } = litRuntime;

const DEFAULT_BACKGROUND_FULL = "/local/energy-bg-full.jpg";
const DEFAULT_BACKGROUND_NO_EV = "/local/energy-bg-no-ev.jpg";
const ACTIVE_THRESHOLD_W = 25;

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

export function weatherIcon(condition) {
  const icons = {
    clear: "mdi:weather-sunny",
    "clear-night": "mdi:weather-night",
    cloudy: "mdi:weather-cloudy",
    exceptional: "mdi:alert-circle-outline",
    fog: "mdi:weather-fog",
    hail: "mdi:weather-hail",
    lightning: "mdi:weather-lightning",
    "lightning-rainy": "mdi:weather-lightning-rainy",
    partlycloudy: "mdi:weather-partly-cloudy",
    pouring: "mdi:weather-pouring",
    rainy: "mdi:weather-rainy",
    snowy: "mdi:weather-snowy",
    "snowy-rainy": "mdi:weather-snowy-rainy",
    sunny: "mdi:weather-sunny",
    windy: "mdi:weather-windy",
    "windy-variant": "mdi:weather-windy-variant",
  };
  return icons[String(condition || "").toLowerCase()] || "mdi:weather-partly-cloudy";
}

function roundTemperature(value) {
  const parsed = parseNumber(value);
  if (parsed === null) return "-";
  return `${Math.round(parsed)} C`;
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
  const showBattery = entityEnabled(config.show_battery, hass, true);

  const gridWatts = parseNumber(stateValue(hass, entities.grid_power)) ?? 0;
  const solarWatts = parseNumber(stateValue(hass, entities.solar_power)) ?? 0;
  const houseWatts = parseNumber(stateValue(hass, entities.house_power)) ?? 0;
  const evWatts = parseNumber(stateValue(hass, entities.ev_power)) ?? 0;
  const batteryWatts = parseNumber(stateValue(hass, entities.battery_power)) ?? 0;
  const batterySoc = stateValue(hass, entities.battery_soc);
  const weatherEntity = entities.weather || config.weather;
  const weatherState = stateValue(hass, weatherEntity);
  const weatherAttributes = stateAttributes(hass, weatherEntity);

  const model = {
    title: config.title || "Energy Flow",
    subtitle: config.subtitle || "Live home power",
    background:
      showEv || !config.background_no_ev
        ? config.background_full || DEFAULT_BACKGROUND_FULL
        : config.background_no_ev || DEFAULT_BACKGROUND_NO_EV,
    entities,
    visible: {
      ev: showEv,
      battery: showBattery,
    },
    grid: {
      watts: gridWatts,
      powerLabel: formatPower(gridWatts),
      status: statusFromPower(gridWatts, "importing", "exporting"),
    },
    solar: {
      watts: solarWatts,
      powerLabel: formatPower(solarWatts),
      status: solarWatts > ACTIVE_THRESHOLD_W ? "producing" : "idle",
    },
    house: {
      watts: houseWatts,
      powerLabel: formatPower(houseWatts),
      status: "consuming",
    },
    ev: {
      watts: evWatts,
      powerLabel: formatPower(evWatts),
      status: statusFromPower(evWatts, "charging", "discharging", "plugged in"),
    },
    battery: {
      watts: batteryWatts,
      powerLabel: formatPower(batteryWatts),
      socLabel: formatPercent(batterySoc),
      status: statusFromPower(batteryWatts, "charging", "discharging"),
    },
    energyToday: {
      grid: formatEnergy(stateValue(hass, energyToday.grid)),
      solar: formatEnergy(stateValue(hass, energyToday.solar)),
      home: formatEnergy(stateValue(hass, energyToday.home)),
    },
    weather: {
      entity: weatherEntity,
      condition: weatherState,
      icon: weatherIcon(weatherState),
      temperatureLabel: roundTemperature(weatherAttributes.temperature),
    },
    flows: [],
  };

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
  model.flows.push(
    flow("solar", solarWatts, "production", "M 63 8 C 59 16, 54 22, 49 29 S 45 36, 39 40", "#ffd15a"),
  );
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
        "M 40 43 C 31 46, 26 47, 16 46",
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
  };

  static styles = css`
    :host {
      display: block;
      color: var(--energy-card-text, #f7fbff);
      --energy-card-accent: #58d5ff;
      --energy-card-gold: #ffd15a;
      --energy-card-radius: 8px;
      --energy-card-height: min(76vh, 760px);
      --energy-card-min-height: 420px;
      --energy-card-glass: rgba(4, 12, 18, .58);
      --energy-card-border: rgba(220, 242, 255, .24);
      --energy-card-muted: rgba(232, 245, 255, .72);
      --energy-card-shadow: 0 24px 70px rgba(0, 0, 0, .46);
      font-family: var(--energy-card-font-family, var(--paper-font-body1_-_font-family, Inter, sans-serif));
    }

    ha-card {
      position: relative;
      overflow: hidden;
      min-height: var(--energy-card-min-height);
      height: var(--energy-card-height);
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
      background-size: cover;
      transform: scale(1.012);
      filter: saturate(1.08) contrast(1.06);
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
      position: relative;
      z-index: 2;
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr auto;
      padding: clamp(16px, 2.4vw, 34px);
      box-sizing: border-box;
    }

    .topbar {
      display: grid;
      grid-template-columns: minmax(190px, 1fr) auto auto;
      gap: clamp(12px, 2vw, 28px);
      align-items: start;
    }

    .eyebrow,
    .summary-label,
    .weather-condition,
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

    .weather {
      display: grid;
      grid-template-columns: auto auto;
      gap: 10px;
      align-items: center;
      justify-content: end;
      padding: 10px 12px;
      min-width: 110px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .18);
      background: rgba(3, 12, 18, .48);
      backdrop-filter: blur(16px);
    }

    .weather ha-icon {
      color: var(--energy-card-gold);
      filter: drop-shadow(0 0 14px rgba(255, 209, 90, .55));
    }

    .weather-temp {
      font-size: clamp(18px, 1.7vw, 26px);
      font-weight: 650;
      line-height: 1;
      white-space: nowrap;
    }

    .weather-condition {
      margin-top: 4px;
      font-size: 9px;
      text-align: right;
    }

    .mid {
      position: relative;
      min-height: 0;
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

    .node {
      position: absolute;
      display: grid;
      gap: 3px;
      min-width: 116px;
      padding: 9px 11px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .18);
      background: var(--energy-card-glass);
      backdrop-filter: blur(13px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, .34);
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
      font-size: clamp(18px, 2vw, 30px);
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
      top: 9%;
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
      left: 8%;
      bottom: 21%;
      color: #dbfff6;
    }

    .statusbar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

    @media (max-width: 900px) {
      :host {
        --energy-card-height: 680px;
        --energy-card-min-height: 620px;
      }

      .topbar {
        grid-template-columns: 1fr;
      }

      .summary {
        grid-auto-flow: row;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .weather {
        justify-self: start;
      }

      .statusbar {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .node {
        min-width: 98px;
      }
    }

    @media (max-width: 560px) {
      :host {
        --energy-card-height: 720px;
      }

      .content {
        padding: 14px;
      }

      .summary {
        grid-template-columns: 1fr;
      }

      .statusbar {
        grid-template-columns: 1fr;
      }

      .node-solar {
        left: 44%;
      }

      .node-house {
        left: 33%;
      }
    }
  `;

  setConfig(config) {
    if (!config) throw new Error("energy-home-visual-card requires a configuration object");
    if (!config.entities || !config.entities.grid_power || !config.entities.solar_power || !config.entities.house_power) {
      throw new Error("energy-home-visual-card requires entities.grid_power, entities.solar_power, and entities.house_power");
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
      <ha-card style="--energy-background: url('${model.background}')">
        <div class="scene"></div>
        <div class="atmosphere"></div>
        <div class="content">
          ${this.renderTopbar(model)}
          <div class="mid">
            ${this.renderFlows(model)}
            ${this.renderNode("solar", "Solar", model.solar.powerLabel, model.solar.status, model.entities.solar_power)}
            ${this.renderNode("grid", "Grid", model.grid.powerLabel, model.grid.status, model.entities.grid_power)}
            ${this.renderNode("house", "Home", model.house.powerLabel, model.house.status, model.entities.house_power)}
            ${model.visible.ev
              ? this.renderNode("ev", "EV", model.ev.powerLabel, model.ev.status, model.entities.ev_power)
              : html``}
            ${model.visible.battery
              ? this.renderNode(
                  "battery",
                  "Battery",
                  model.battery.powerLabel,
                  `${model.battery.status} / ${model.battery.socLabel}`,
                  model.entities.battery_power,
                )
              : html``}
          </div>
          ${this.renderStatusbar(model)}
        </div>
      </ha-card>
    `;
  }

  renderTopbar(model) {
    return html`
      <div class="topbar">
        <div>
          <div class="eyebrow">${model.subtitle}</div>
          <div class="title">${model.title}</div>
        </div>
        <div class="summary" aria-label="Daily energy summary">
          ${this.renderSummaryItem("Grid", model.energyToday.grid)}
          ${this.renderSummaryItem("Solar", model.energyToday.solar)}
          ${this.renderSummaryItem("Home", model.energyToday.home)}
        </div>
        <button class="weather" type="button" @click=${() => this.openMoreInfo(model.weather.entity)}>
          <ha-icon icon=${model.weather.icon}></ha-icon>
          <span>
            <span class="weather-temp">${model.weather.temperatureLabel}</span>
            <span class="weather-condition">${model.weather.condition}</span>
          </span>
        </button>
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
          `;
        })}
      </svg>
    `;
  }

  renderNode(kind, label, value, status, entityId) {
    return html`
      <button class="node node-${kind}" type="button" @click=${() => this.openMoreInfo(entityId)}>
        <span class="node-label">${label}</span>
        <span class="node-value">${value}</span>
        <span class="node-status">${status}</span>
      </button>
    `;
  }

  renderStatusbar(model) {
    return html`
      <div class="statusbar">
        ${this.renderPill("Electricity", model.grid.status, model.grid.powerLabel, "mdi:transmission-tower", "#58bfff", model.entities.grid_power)}
        ${this.renderPill("Solar", model.solar.status, model.solar.powerLabel, "mdi:solar-power-variant", "#ffd15a", model.entities.solar_power)}
        ${model.visible.ev
          ? this.renderPill("Electric Vehicle", model.ev.status, model.ev.powerLabel, "mdi:car-electric", "#50eaff", model.entities.ev_power)
          : html``}
        ${model.visible.battery
          ? this.renderPill(
              "Battery",
              model.battery.status,
              `${model.battery.powerLabel} / ${model.battery.socLabel}`,
              "mdi:home-battery",
              "#56f0d0",
              model.entities.battery_power || model.entities.battery_soc,
            )
          : html``}
      </div>
    `;
  }

  renderPill(label, status, value, icon, color, entityId) {
    return html`
      <button class="pill" type="button" style="--pill-color:${color}" @click=${() => this.openMoreInfo(entityId)}>
        <ha-icon icon=${icon}></ha-icon>
        <span>
          <span class="pill-label">${label}</span>
          <span class="pill-main">
            <span class="pill-status">${status}</span>
            <span class="pill-value">${value}</span>
          </span>
        </span>
      </button>
    `;
  }

  openMoreInfo(entityId) {
    if (!entityId) return;
    fireEvent(this, "hass-more-info", { entityId });
  }
}

if (typeof customElements !== "undefined" && !customElements.get("energy-home-visual-card")) {
  customElements.define("energy-home-visual-card", EnergyHomeVisualCard);
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
