# Energy Home Visual Card Setup

This card can be configured from the Home Assistant visual card editor or with YAML. The visual editor exposes the same fields listed below; YAML is useful when copying between dashboards or when using helper entities for setup toggles.

## Install With HACS

1. In HACS, add this as a custom Dashboard repository:

```text
RoBro92/HACS-home-energy-card
```

2. Install the card.
3. Confirm the Lovelace resource exists:

```yaml
url: /hacsfiles/HACS-home-energy-card/energy-home-visual-card.js
type: module
```

4. Hard refresh the browser after installing or updating the card.

## Visual Editor

In a Home Assistant dashboard:

1. Edit the dashboard.
2. Add a manual card or search for `Energy Home Visual Card`.
3. Enter your entity IDs in the card editor fields.
4. Use the setup fields to enable or disable EV, solar, and battery sections.

The `show_ev`, `show_solar`, and `show_battery` fields accept either `true`/`false` or a helper entity such as `input_boolean.has_ev`. Helper entities are useful when you want one dashboard card to adapt to different homes.

## Required Sensors

Only these two sensors are always required:

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.grid_power` | W | Positive values import from grid. Negative values export to grid. |
| `entities.house_power` | W | Current home consumption. |

## Optional Solar Sensors

Enable solar with `show_solar: true` or an entity that is on.

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.solar_power` | W | Current solar production. |
| `solar_capacity_kw` | kW | Fixed install capacity, for example `5` for a 5 kW array. |
| `entities.solar_capacity` | kW or W | Optional sensor alternative to `solar_capacity_kw`. |

Solar efficiency is calculated as:

```text
solar_power / solar_capacity * 100
```

For example, `4500 W` production on a `5 kW` array displays `90%`.

## Optional Battery Sensors

Enable battery with `show_battery: true` or an entity that is on.

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.battery_power` | W | Positive values charge the battery. Negative values discharge the battery. |
| `entities.battery_soc` | % | Battery state of charge. |
| `battery_capacity_kwh` | kWh | Fixed battery capacity, for example `13.5`. |
| `entities.battery_capacity` | kWh or Wh | Optional sensor alternative to `battery_capacity_kwh`. |

## Optional EV Sensors

Enable EV with `show_ev: true` or an entity that is on.

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.ev_power` | W | Current EV charge power. Negative values are treated as vehicle-to-home discharge. |
| `entities.ev_soc` | % | EV state of charge. |
| `entities.ev_charging_state` | state or binary | `on`, `true`, or `charging` displays as charging. `off`, `false`, or `not_charging` displays as not charging. Other states are shown as readable text. |

## Day And Night Image Switching

The card uses `entities.sun` for day/night switching. In most Home Assistant installs this should be:

```yaml
entities:
  sun: sun.sun
```

The bundled backgrounds switch to day when the sun entity is `above_horizon` and night when it is `below_horizon`. You can also set `time_of_day` to an entity or a fixed value:

```yaml
time_of_day: binary_sensor.daylight
```

Accepted day states are `above_horizon`, `day`, `sunny`, `on`, and `true`. Accepted night states are `below_horizon`, `night`, `off`, and `false`.

## Full Example

```yaml
type: custom:energy-home-visual-card
title: Energy Flow
subtitle: Live home power

show_ev: input_boolean.has_ev
show_solar: input_boolean.has_solar
show_battery: input_boolean.has_battery

solar_capacity_kw: 5
battery_capacity_kwh: 13.5

entities:
  sun: sun.sun
  grid_power: sensor.grid_power_w
  house_power: sensor.house_consumption_w
  solar_power: sensor.solar_power_w
  battery_power: sensor.battery_power_w
  battery_soc: sensor.battery_soc
  ev_power: sensor.ev_charging_power_w
  ev_soc: sensor.ev_state_of_charge
  ev_charging_state: binary_sensor.ev_charging

energy_today:
  grid: sensor.grid_energy_today
  solar: sensor.solar_energy_today
  home: sensor.home_energy_today
```

## No EV Example

```yaml
type: custom:energy-home-visual-card
show_ev: false
show_solar: true
show_battery: true
solar_capacity_kw: 5
battery_capacity_kwh: 13.5

entities:
  sun: sun.sun
  grid_power: sensor.grid_power_w
  house_power: sensor.house_consumption_w
  solar_power: sensor.solar_power_w
  battery_power: sensor.battery_power_w
  battery_soc: sensor.battery_soc
```

## No Solar Or Battery Example

```yaml
type: custom:energy-home-visual-card
show_ev: true
show_solar: false
show_battery: false

entities:
  sun: sun.sun
  grid_power: sensor.grid_power_w
  house_power: sensor.house_consumption_w
  ev_power: sensor.ev_charging_power_w
  ev_soc: sensor.ev_state_of_charge
  ev_charging_state: binary_sensor.ev_charging
```

## Background Selection

The card automatically chooses one of the bundled day/night backgrounds based on the active setup:

| Setup | Active options |
| --- | --- |
| `full` | EV, solar, and battery |
| `ev_solar` | EV and solar |
| `ev_battery` | EV and battery |
| `solar_battery` | Solar and battery |
| `ev_only` | EV only |
| `solar_only` | Solar only |
| `battery_only` | Battery only |
| `base` | No EV, solar, or battery |

You only need custom background config if you want to override the bundled images.
