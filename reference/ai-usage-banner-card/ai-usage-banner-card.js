export function stateValue(hass, entityId) {
  if (!hass || !entityId || !hass.states || !hass.states[entityId]) return "unknown";
  return hass.states[entityId].state ?? "unknown";
}

export function clampPercent(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

export function formatPercent(value) {
  const percent = clampPercent(value);
  if (percent === null) return "-";
  return `${Math.round(percent)}%`;
}

export function formatResetTime(value, now = new Date()) {
  if (!value || value === "unknown" || value === "unavailable") return "-";
  const reset = new Date(value);
  if (Number.isNaN(reset.getTime())) return String(value);

  const diffMs = reset.getTime() - now.getTime();
  if (diffMs <= 0) return "now";

  const totalMinutes = Math.round(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function metricState(hass, metric) {
  const remaining = stateValue(hass, metric?.remaining);
  const reset = stateValue(hass, metric?.reset);
  return {
    percent: clampPercent(remaining),
    percentLabel: formatPercent(remaining),
    resetLabel: formatResetTime(reset),
    hasRemaining: !!metric?.remaining && clampPercent(remaining) !== null,
    hasReset: !!metric?.reset && reset !== "unknown" && reset !== "unavailable",
  };
}

function renderMetric(label, resetLabel, metric, dimmed = false) {
  const width = metric.percent ?? 0;
  const statusClass = metric.hasRemaining ? "" : " is-missing";
  const resetClass = metric.hasReset ? "" : " is-missing";

  return `
    <div class="usage-row${dimmed ? " is-dimmed" : ""}">
      <div class="usage-main">
        <div class="usage-labels">
          <span>${escapeHtml(label)}</span>
          <span>${escapeHtml(metric.percentLabel)}</span>
        </div>
        <div class="rail${statusClass}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${width}">
          <div class="fill" style="width:${width}%"></div>
          <div class="mesh"></div>
          <div class="beam beam-a"></div>
          <div class="beam beam-b"></div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="reset${resetClass}">
        <div class="reset-kicker">${escapeHtml(resetLabel)}</div>
        <div class="reset-value">${escapeHtml(metric.resetLabel)}</div>
      </div>
    </div>
  `;
}

const DEFAULT_LOGOS = {
  gemini: "https://cdn.simpleicons.org/googlegemini/54f2ef",
  claude: "https://cdn.simpleicons.org/claude/b9a7ff",
  gpt: "https://upload.wikimedia.org/wikipedia/commons/6/66/OpenAI_logo_2025_%28symbol%29.svg",
  ai: "https://upload.wikimedia.org/wikipedia/commons/6/66/OpenAI_logo_2025_%28symbol%29.svg",
};

export function logoTypeForModel(model) {
  const value = `${model?.logo || ""} ${model?.name || ""} ${model?.mark || ""}`.toLowerCase();
  if (value.includes("gemini")) return "gemini";
  if (value.includes("claude") || value.includes("clude")) return "claude";
  if (value.includes("gpt") || value.includes("openai")) return "gpt";
  return "ai";
}

export function logoUrlForModel(model) {
  const explicitLogo = String(model?.logo || "");
  if (
    explicitLogo.startsWith("http://") ||
    explicitLogo.startsWith("https://") ||
    explicitLogo.startsWith("data:") ||
    explicitLogo.startsWith("/local/") ||
    explicitLogo.startsWith("/api/")
  ) {
    return explicitLogo;
  }
  return DEFAULT_LOGOS[logoTypeForModel(model)] || DEFAULT_LOGOS.ai;
}

function renderLogo(model) {
  const name = model.name || "AI model";
  const type = logoTypeForModel(model);
  return `<img class="logo-img logo-img-${escapeHtml(type)}" src="${escapeHtml(logoUrlForModel(model))}" alt="${escapeHtml(name)} logo" loading="lazy" referrerpolicy="no-referrer">`;
}

const BaseHTMLElement = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

class AiUsageBannerCard extends BaseHTMLElement {
  setConfig(config) {
    if (!config || !Array.isArray(config.models) || config.models.length === 0) {
      throw new Error("ai-usage-banner-card requires a models array");
    }

    this.config = config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return Math.max(1, this.config?.models?.length || 1);
  }

  render() {
    if (!this.shadowRoot || !this.config) return;
    const title = this.config.title || "AI Usage";
    const subtitle = this.config.subtitle || "Allowance remaining";
    const models = this.config.models.map((model) => this.renderModel(model)).join("");

    this.shadowRoot.innerHTML = `
      <style>${AiUsageBannerCard.styles}</style>
      <ha-card>
        <div class="wrap">
          <div class="heading">
            <div>
              <div class="eyebrow">${escapeHtml(subtitle)}</div>
              <div class="title">${escapeHtml(title)}</div>
            </div>
          </div>
          <div class="models">${models}</div>
        </div>
      </ha-card>
    `;
  }

  renderModel(model) {
    const fiveHour = metricState(this._hass, model.five_hour || model.fiveHour);
    const weekly = metricState(this._hass, model.weekly);

    return `
      <section class="model" style="--accent:${escapeHtml(model.accent || "#54f2ef")}">
        <div class="model-head">
          <div class="logo">${renderLogo(model)}</div>
          <div class="model-name">${escapeHtml(model.name || "AI Model")}</div>
        </div>
        <div class="rows">
          ${renderMetric("5h remaining", "5H RESET", fiveHour)}
          ${renderMetric("Weekly remaining", "WEEK RESET", weekly, true)}
        </div>
      </section>
    `;
  }
}

AiUsageBannerCard.styles = `
  :host {
    display: block;
    width: 62.5%;
    max-width: 62.5%;
    margin: 0 auto 0 0;
    box-sizing: border-box;
    --ai-bg: #07131b;
    --ai-text: #ddf7ff;
    --ai-muted: rgba(226, 247, 255, .72);
  }

  ha-card {
    overflow: hidden;
    width: 100%;
    border-radius: 8px;
    border: 0;
    background:
      radial-gradient(circle at 86% 8%, rgba(126, 91, 255, .24), transparent 18%),
      radial-gradient(circle at 76% 48%, rgba(46, 242, 219, .19), transparent 26%),
      radial-gradient(circle at 58% 36%, rgba(255, 126, 180, .10), transparent 18%),
      linear-gradient(135deg, #061017, #10283a 58%, #07111a);
    box-shadow: none;
    color: var(--ai-text);
  }

  .wrap {
    padding: clamp(6px, .95vw, 10px);
  }

  .heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    margin: 0 0 5px;
  }

  .eyebrow {
    color: var(--ai-muted);
    font-size: 10px;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .title {
    font-size: clamp(14px, 1.25vw, 18px);
    line-height: 1.1;
    font-weight: 500;
    letter-spacing: 0;
  }

  .models {
    display: grid;
    gap: 6px;
  }

  .model {
    position: relative;
    min-height: 73px;
    display: grid;
    grid-template-columns: minmax(115px, 165px) minmax(0, 1fr);
    align-items: center;
    gap: clamp(9px, 1.25vw, 13px);
    padding: clamp(8px, 1vw, 10px);
    border: 1px solid rgba(168, 221, 255, .42);
    border-radius: 11px;
    background: rgba(8, 20, 30, .78);
    box-shadow: inset 0 0 20px rgba(85, 220, 255, .10), 0 10px 30px rgba(0, 0, 0, .24);
    box-sizing: border-box;
    overflow: hidden;
  }

  .model::before {
    content: "";
    position: absolute;
    inset: -70% -12% auto auto;
    width: 130px;
    height: 90px;
    background: radial-gradient(circle, color-mix(in srgb, var(--accent), transparent 62%), transparent 68%);
    opacity: .72;
    pointer-events: none;
  }

  .model-head {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }

  .logo {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    color: color-mix(in srgb, var(--accent), white 25%);
    filter: drop-shadow(0 0 7px color-mix(in srgb, var(--accent), transparent 44%));
  }

  .logo-img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  .logo-img-gpt,
  .logo-img-ai {
    filter: invert(1) brightness(1.35);
  }

  .model-name {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: clamp(13px, 1.4vw, 16px);
    line-height: 1.05;
    font-weight: 500;
    letter-spacing: 0;
  }

  .rows {
    position: relative;
    display: grid;
    gap: 5px;
  }

  .usage-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 1px minmax(65px, 83px);
    align-items: center;
    gap: clamp(6px, 1vw, 10px);
  }

  .usage-row.is-dimmed {
    opacity: .86;
  }

  .usage-labels {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    margin: 0 0 3px;
    color: rgba(232, 247, 255, .78);
    font-size: clamp(9px, .9vw, 10px);
    line-height: 1.2;
  }

  .rail {
    position: relative;
    height: clamp(13px, 1.25vw, 15px);
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--accent), white 18%);
    border-radius: 6px;
    background: rgba(7, 27, 37, .70);
    box-shadow: inset 0 0 8px color-mix(in srgb, var(--accent), transparent 84%), 0 0 6px color-mix(in srgb, var(--accent), transparent 88%);
  }

  .rail.is-missing {
    opacity: .45;
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent), transparent 54%), color-mix(in srgb, var(--accent), transparent 78%));
  }

  .mesh {
    position: absolute;
    inset: -3px;
    background:
      repeating-linear-gradient(113deg, rgba(143, 241, 255, .26) 0 1px, transparent 1px 10px),
      repeating-linear-gradient(67deg, rgba(143, 241, 255, .13) 0 1px, transparent 1px 12px);
    opacity: .72;
  }

  .beam {
    position: absolute;
    height: 1px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent), white 10%), transparent);
    box-shadow: 0 0 10px color-mix(in srgb, var(--accent), transparent 12%);
  }

  .beam-a {
    left: 7%;
    right: 20%;
    top: 47%;
    transform: translateY(-50%) rotate(-6deg);
  }

  .beam-b {
    left: 34%;
    right: 8%;
    top: 53%;
    transform: translateY(-50%) rotate(7deg);
    opacity: .72;
  }

  .divider {
    height: 28px;
    background: rgba(176, 226, 255, .32);
  }

  .reset {
    min-width: 0;
  }

  .reset.is-missing {
    opacity: .5;
  }

  .reset-kicker {
    color: var(--ai-muted);
    font-size: clamp(8px, .75vw, 9px);
    line-height: 1.1;
  }

  .reset-value {
    margin-top: 1px;
    color: #f0fbff;
    font-size: clamp(11px, 1.05vw, 14px);
    line-height: 1.08;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    :host {
      width: 100%;
      max-width: 100%;
    }

    .model {
      min-height: 0;
      border-radius: 10px;
      grid-template-columns: minmax(0, 1fr);
    }

    .usage-row {
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
    }

    .divider {
      display: none;
    }

    .reset {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
  }
`;

if (typeof window !== "undefined" && typeof HTMLElement !== "undefined" && !customElements.get("ai-usage-banner-card")) {
  customElements.define("ai-usage-banner-card", AiUsageBannerCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "ai-usage-banner-card",
    name: "AI Usage Banner Card",
    description: "Cinematic two-bar AI allowance monitor.",
  });
}
