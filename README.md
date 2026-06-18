# Energy Home Visual Card

`energy-home-visual-card` is a fullscreen-friendly Home Assistant Lovelace custom card for cinematic energy monitoring. It places animated SVG power-flow lines over a high-quality home energy background and renders live values for grid, solar, house load, EV charging, battery state, and daily energy.

## Features

- LitElement custom card registered as `custom:energy-home-visual-card`.
- Switches between setup-specific backgrounds using `show_ev`, `show_solar`, and `show_battery`.
- Supports day/night background switching from `sun.sun` or another configured entity.
- Supports `show_ev`, `show_solar`, and `show_battery` as booleans or Home Assistant entities.
- Configurable entity IDs for power, energy summary, and battery SOC.
- Animated SVG flow overlays for grid, solar, EV, and battery.
- Animation speed scales with the current power value.
- Import/export and charge/discharge direction handling.
- Bottom status bar with Electricity, Solar, Electric Vehicle, and Battery pills.
- Tap/click on major elements opens the relevant entity more-info dialog.
- Uses CSS variables so `card-mod` can override sizing, radius, colors, and shadow.

## Basic Usage

```yaml
type: custom:energy-home-visual-card
backgrounds:
  full:
    day: /local/energy-bg-full-day.png
    night: /local/energy-bg-full-night.png
  ev_solar:
    day: /local/energy-bg-ev-solar-day.png
    night: /local/energy-bg-ev-solar-night.png
  ev_battery:
    day: /local/energy-bg-ev-battery-day.png
    night: /local/energy-bg-ev-battery-night.png
  solar_battery:
    day: /local/energy-bg-no-ev-day.png
    night: /local/energy-bg-no-ev-night.png
  ev_only:
    day: /local/energy-bg-no-solar-battery-day.png
    night: /local/energy-bg-no-solar-battery-night.png
  solar_only:
    day: /local/energy-bg-solar-only-day.png
    night: /local/energy-bg-solar-only-night.png
  battery_only:
    day: /local/energy-bg-battery-only-day.png
    night: /local/energy-bg-battery-only-night.png
  base:
    day: /local/energy-bg-base-day.png
    night: /local/energy-bg-base-night.png

show_ev: input_boolean.has_ev
show_solar: input_boolean.has_solar
show_battery: input_boolean.has_battery

entities:
  sun: sun.sun
  grid_power: sensor.grid_power_w
  solar_power: sensor.solar_power_w
  house_power: sensor.house_consumption_w
  ev_power: sensor.ev_charging_power_w
  battery_power: sensor.battery_power_w
  battery_soc: sensor.battery_soc

energy_today:
  grid: sensor.grid_energy_today
  solar: sensor.solar_energy_today
  home: sensor.home_energy_today
```

See `examples/dashboard.yaml` and `examples/dashboard-no-ev.yaml` for fuller dashboard snippets.

## Config

| Key | Required | Description |
| --- | --- | --- |
| `backgrounds.full.day/night` | No | Images for EV + solar + battery setup. |
| `backgrounds.ev_solar.day/night` | No | Images for EV + solar, with no battery. |
| `backgrounds.ev_battery.day/night` | No | Images for EV + battery, with no solar. |
| `backgrounds.solar_battery.day/night` | No | Images for solar + battery, with no EV/car. |
| `backgrounds.ev_only.day/night` | No | Images for EV only, with no solar or battery. |
| `backgrounds.solar_only.day/night` | No | Images for solar only, with no EV or battery. |
| `backgrounds.battery_only.day/night` | No | Images for battery only, with no EV or solar. |
| `backgrounds.base.day/night` | No | Images for homes without EV, solar, or battery. |
| `background_full` | No | Legacy single full image fallback. |
| `background_no_ev` | No | Legacy no-EV image fallback. |
| `show_ev` | No | Boolean or entity. Entity states `on`, `true`, `home`, `charging`, `plugged_in`, and `connected` show the EV. |
| `show_solar` | No | Boolean or entity. Defaults to visible. |
| `show_battery` | No | Boolean or entity. Defaults to visible. |
| `entities.sun` | No | Sun entity for day/night switching. Defaults to `sun.sun`; falls back to local time if unavailable. |
| `entities.grid_power` | Yes | Current grid power in W. Positive is importing, negative is exporting. |
| `entities.solar_power` | Yes | Current solar production in W. |
| `entities.house_power` | Yes | Current house consumption in W. |
| `entities.ev_power` | When EV shown | Current EV charging power in W. |
| `entities.battery_power` | When battery shown | Current battery power in W. Positive is charging, negative is discharging. |
| `entities.battery_soc` | When battery shown | Battery state of charge percentage. |
| `energy_today.grid` | No | Daily grid energy sensor in kWh. |
| `energy_today.solar` | No | Daily solar energy sensor in kWh. |
| `energy_today.home` | No | Daily home energy sensor in kWh. |

## Background Selection

The card chooses the background in this order:

1. Setup: `full`, `ev_solar`, `ev_battery`, `solar_battery`, `ev_only`, `solar_only`, `battery_only`, or `base`.
2. Setup aliases: `no_ev` still maps to `solar_battery`, and `no_solar_battery` still maps to `ev_only`.
3. Time: `day` or `night`, based on `entities.sun`, `time_of_day`, or local clock fallback.

## Card-Mod Variables

```yaml
card_mod:
  style: |
    energy-home-visual-card {
      --energy-card-height: 82vh;
      --energy-card-radius: 8px;
      --energy-card-accent: #58d5ff;
      --energy-card-shadow: none;
    }
```

## Local Gitea Notes

This local package is staged under:

```text
gitea/StonewallMedia/energy-home-visual-card
```

The intended Gitea remote is:

```text
https://gitea.stonewallmedia.co.uk/StonewallMedia/energy-home-visual-card.git
```

The previous AI usage custom card source and tests were copied into:

```text
reference/ai-usage-banner-card/
```

That keeps the current card work available as a reference without mixing the two card implementations.
