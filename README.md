# HACS Home Energy Card

A cinematic Home Assistant dashboard card for home energy. Live grid, solar, home, battery, and EV power float over a day or night scene, with a bottom bar of energy glance cards and tap-to-open detail panels.

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=RoBro92&repository=HACS-home-energy-card&category=dashboard)

![HACS Home Energy Card, full setup in daylight](docs/images/card-day.png)

## Install

1. In HACS, add `RoBro92/HACS-home-energy-card` as a custom **Dashboard** repository and install it.
2. Confirm the dashboard resource exists:

   ```yaml
   url: /hacsfiles/HACS-home-energy-card/HACS-home-energy-card.js
   type: module
   ```

3. Hard refresh Home Assistant, then add **HACS Home Energy Card** to a dashboard.

The card and its background images install together. Only two sensors are required: grid power and home power. The card suggests sensors from your instance, and shows a short hint until both are set.

## Preview

| Day | Night |
| --- | --- |
| ![Day](docs/images/card-day.png) | ![Night](docs/images/card-night.png) |

| No EV | No solar | No battery |
| --- | --- | --- |
| ![No EV](docs/images/card-no-ev.png) | ![No solar](docs/images/card-no-solar.png) | ![No battery](docs/images/card-no-battery.png) |

| Base home | Detail panel |
| --- | --- |
| ![Base home](docs/images/card-base.png) | ![Solar detail panel](docs/images/card-solar-detail.png) |

## What it does

- **Adapts to your home.** Switch solar, battery, and EV on or off and the card picks a matching scene for that combination, day and night, following `sun.sun`.
- **Shows direction, not just numbers.** Each node reads importing or exporting, producing, charging or discharging, and glows softly while power flows.
- **Energy glance cards.** Up to five along the bottom: cost today with a budget bar, grid cost now, current tariff, self powered share, grid import and export, home, solar, EV, and battery daily totals, battery reserve, sunrise or sunset, weather, or any entity.
- **Detail panels.** Tap a node or card for the core values plus any extra sensors you add. Locks, switches, and buttons become controls.
- **A sectioned editor.** Every option is in the visual editor, grouped by system. YAML only for helpers and custom labels.

## Quick start

```yaml
type: custom:hacs-home-energy-card
show_solar: true
show_battery: true
show_ev: true
solar_capacity_kw: 5
battery_capacity_kwh: 13.5

entities:
  grid_power: sensor.grid_power_w
  house_power: sensor.house_consumption_w
  solar_power: sensor.solar_power_w
  battery_power: sensor.battery_power_w
  battery_soc: sensor.battery_soc
  ev_power: sensor.ev_charging_power_w
  ev_soc: sensor.ev_state_of_charge

energy_today:
  grid_import: sensor.grid_import_today
  grid_export: sensor.grid_export_today
  home: sensor.home_energy_today
  solar: sensor.solar_energy_today

costs:
  today_entity: sensor.energy_cost_today
  daily_budget: 5

bottom_bar:
  - type: cost_today
  - type: self_powered_today
  - type: grid_import_export
  - type: battery_reserve
  - type: solar_today
```

Leave `bottom_bar` out and the card shows the glance cards it has data for.

## Documentation

- [Setup guide](docs/setup.md): every option, the glance card types, detail panels, tariffs, day and night, sizing.
- [Full example](examples/dashboard.yaml) and [no EV example](examples/dashboard-no-ev.yaml).
- [Public testing notes](docs/public-testing.md) and [brand assets](docs/brand-assets.md).

## Theming

Card Mod can override the frame:

```yaml
card_mod:
  style: |
    hacs-home-energy-card {
      --energy-card-radius: 8px;
      --energy-card-accent: #58d5ff;
      --energy-card-shadow: none;
    }
```

## Development

```sh
npm ci
npm run build   # bundles lit into dist/ and copies the backgrounds
npm run check   # syntax check and unit tests
```

`dist/` is what HACS serves and what `demo/index.html` loads, so commit it with each change. Releases are created by pushing a `v*` tag that matches `package.json`; see [the release checklist](.github/release-checklist.md).
