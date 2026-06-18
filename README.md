# Energy Home Visual Card

`energy-home-visual-card` is a fullscreen-friendly Home Assistant Lovelace custom card for cinematic energy monitoring. It places animated SVG power-flow lines over a high-quality home energy background and renders live values for grid, solar, house load, EV charging, battery state, daily energy, and weather.

## Features

- LitElement custom card registered as `custom:energy-home-visual-card`.
- Switches between `energy-bg-full.jpg` and `energy-bg-no-ev.jpg` using `show_ev`.
- Supports `show_ev` and `show_battery` as booleans or Home Assistant entities.
- Configurable entity IDs for power, energy summary, battery SOC, and weather.
- Animated SVG flow overlays for grid, solar, EV, and battery.
- Animation speed scales with the current power value.
- Import/export and charge/discharge direction handling.
- Bottom status bar with Electricity, Solar, Electric Vehicle, and Battery pills.
- Tap/click on major elements opens the relevant entity more-info dialog.
- Uses CSS variables so `card-mod` can override sizing, radius, colors, and shadow.

## Basic Usage

```yaml
type: custom:energy-home-visual-card
background_full: /local/energy-bg-full.jpg
background_no_ev: /local/energy-bg-no-ev.jpg

show_ev: input_boolean.has_ev
show_battery: input_boolean.has_battery

entities:
  grid_power: sensor.grid_power_w
  solar_power: sensor.solar_power_w
  house_power: sensor.house_consumption_w
  ev_power: sensor.ev_charging_power_w
  battery_power: sensor.battery_power_w
  battery_soc: sensor.battery_soc
  weather: weather.home

energy_today:
  grid: sensor.grid_energy_today
  solar: sensor.solar_energy_today
  home: sensor.home_energy_today
```

See `examples/dashboard.yaml` and `examples/dashboard-no-ev.yaml` for fuller dashboard snippets.

## Config

| Key | Required | Description |
| --- | --- | --- |
| `background_full` | No | Image with house, solar, grid, EV/carport, and battery. Defaults to `/local/energy-bg-full.jpg`. |
| `background_no_ev` | No | Image with no EV/carport. Defaults to `/local/energy-bg-no-ev.jpg`. |
| `show_ev` | No | Boolean or entity. Entity states `on`, `true`, `home`, `charging`, `plugged_in`, and `connected` show the EV. |
| `show_battery` | No | Boolean or entity. Defaults to visible. |
| `entities.grid_power` | Yes | Current grid power in W. Positive is importing, negative is exporting. |
| `entities.solar_power` | Yes | Current solar production in W. |
| `entities.house_power` | Yes | Current house consumption in W. |
| `entities.ev_power` | When EV shown | Current EV charging power in W. |
| `entities.battery_power` | When battery shown | Current battery power in W. Positive is charging, negative is discharging. |
| `entities.battery_soc` | When battery shown | Battery state of charge percentage. |
| `entities.weather` | No | Weather entity used for condition icon and temperature. |
| `energy_today.grid` | No | Daily grid energy sensor in kWh. |
| `energy_today.solar` | No | Daily solar energy sensor in kWh. |
| `energy_today.home` | No | Daily home energy sensor in kWh. |

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
