# HACS Home Energy Card Setup

This card can be configured from the Home Assistant visual card editor or with YAML. The visual editor exposes the same fields listed below; YAML is useful when copying between dashboards or when using helper entities for setup toggles.

## Install With HACS

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=RoBro92&repository=HACS-home-energy-card&category=dashboard)

1. In HACS, add this as a custom Dashboard repository:

```text
RoBro92/HACS-home-energy-card
```

2. Install the card.
3. Confirm the Lovelace resource exists:

```yaml
url: /hacsfiles/HACS-home-energy-card/HACS-home-energy-card.js
type: module
```

4. Hard refresh the browser after installing or updating the card.

## Visual Editor

In a Home Assistant dashboard:

1. Edit the dashboard.
2. Add a manual card or search for HACS Home Energy Card.
3. Enter your entity IDs in the card editor fields.
4. Use the setup fields to enable or disable EV, solar, and battery sections.

The `show_ev`, `show_solar`, and `show_battery` fields accept either `true`/`false` or a helper entity such as `input_boolean.has_ev`. Helper entities are useful when you want one dashboard card to adapt to different homes.

For the quickest setup, configure only `entities.grid_power` and `entities.house_power` first. After the card renders, add `show_solar`, `show_ev`, `show_battery`, and the matching optional sensors one section at a time.

## Visual Layout Options

The default layout keeps the background clear: floating nodes show compact live values, the bottom bar shows live status, and the top daily summary is hidden.

Clicking a floating node or bottom bar item opens an in card detail panel. The default rows show the core value for that group, and `detail_entities` adds extra rows such as voltage, current, and longer energy totals. Rows backed by entities still open the Home Assistant more info dialog when clicked.

| Field | Default | Notes |
| --- | --- | --- |
| `show_title` | `false` | Set to `true` if you want optional top left title and subtitle text. |
| `show_daily_summary` | `false` | Set to `true` to restore the top daily kWh strip. |
| `show_bottom_bar` | `true` | Set to `false` for a cleaner image only card. |
| `node_detail` | `minimal` | Use `full` if floating nodes should also show status text. |
| `card_width` | blank | Optional fixed card width in pixels. |
| `card_height` | blank | Optional fixed card height in pixels. |
| `min_width` | `320` | Minimum width in pixels. Lower configured widths are clamped. |
| `min_height` | `180` | Minimum height in pixels. Lower configured heights are clamped. |

Leave `card_width` and `card_height` blank for a responsive card that fills the available dashboard column. Set both values when you are designing for a fixed wall panel, kiosk, or dashboard grid slot:

```yaml
card_width: 900
card_height: 506
min_width: 320
min_height: 180
```

If only `card_width` is set, the card keeps its normal aspect ratio. If both width and height are set, the scene scales into that exact pixel box.

## Labels, Node Extras, And Bottom Cards

Every floating node title can be renamed without changing entity IDs:

```yaml
labels:
  grid: Grid
  house: Home
  solar: Solar
  ev: EV
  battery: Battery
  gridCard: Grid cost
  evCard: EV
```

Add one compact extra value to any floating node with `node_info`:

```yaml
node_info:
  solar:
    entity: sensor.solar_efficiency
  ev:
    entity: sensor.ev_range
  battery:
    entity: sensor.battery_temperature
```

Choose the bottom glance cards with `bottom_bar`. Built in card types are `grid`, `cost`, `sun`, `solar`, `house`, `ev`, and `battery`.

```yaml
bottom_bar:
  - type: cost
    label: Grid cost
  - type: sun
  - solar
  - ev
  - battery
```

You can also show any sensor:

```yaml
bottom_bar:
  - type: entity
    label: Water
    status: Today
    entity: sensor.water_usage_today
    icon: mdi:water
```

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

Solar modal detail rows can be added with:

```yaml
detail_entities:
  solar:
    pv_voltage: sensor.solar_pv_voltage
    pv_current: sensor.solar_pv_current
    energy_24h: sensor.solar_energy_24h
    energy_week: sensor.solar_energy_week
    energy_month: sensor.solar_energy_month
```

## Optional Battery Sensors

Enable battery with `show_battery: true` or an entity that is on.

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.battery_power` | W | Positive values charge the battery. Negative values discharge the battery. |
| `entities.battery_soc` | % | Battery state of charge. |
| `battery_capacity_kwh` | kWh | Fixed battery capacity, for example `13.5`. |
| `entities.battery_capacity` | kWh or Wh | Optional sensor alternative to `battery_capacity_kwh`. |

Battery modal detail rows can be added with:

```yaml
detail_entities:
  battery:
    voltage: sensor.battery_voltage
    current: sensor.battery_current
    charge_24h: sensor.battery_charge_24h
    discharge_24h: sensor.battery_discharge_24h
```

## Optional EV Sensors

Enable EV with `show_ev: true` or an entity that is on.

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.ev_power` | W | Current EV charge power. Negative values are treated as vehicle to home discharge. |
| `entities.ev_soc` | % | EV state of charge. |
| `entities.ev_charging_state` | state or binary | `on`, `true`, or `charging` displays as charging. `off`, `false`, or `not_charging` displays as not charging. Other states are shown as readable text. |

EV modal detail rows can be added with:

```yaml
detail_entities:
  ev:
    voltage: sensor.ev_voltage
    current: sensor.ev_current
    energy_24h: sensor.ev_energy_24h
    energy_week: sensor.ev_energy_week
```

## Optional Grid And Home Detail Sensors

Grid cost supports either fixed rates or dynamic rate sensors. Dynamic sensors are better for multiple tariff energy providers because the card reads the current import and export tariff directly from Home Assistant.

```yaml
tariffs:
  currency: £
  import_rate: 0.34
  export_rate: 0.15
  import_rate_entity: sensor.current_import_rate
  export_rate_entity: sensor.current_export_rate
```

The cost card shows the current import cost or export credit per hour based on `entities.grid_power`.

```yaml
detail_entities:
  grid:
    import_24h: sensor.grid_import_24h
    export_24h: sensor.grid_export_24h
  house:
    energy_24h: sensor.home_energy_24h
    energy_week: sensor.home_energy_week
    energy_month: sensor.home_energy_month
```

The card also accepts custom keys under each detail group. Unknown keys are converted into readable labels, so `inverter_temperature` displays as `Inverter Temperature`.

## Optional Detail Panel Actions

Detail panels can show quick action buttons. Actions are Home Assistant service calls, so use entity IDs and services rather than device IDs.

```yaml
actions:
  ev:
    - label: Boost charge
      service: switch.turn_on
      target:
        entity_id: switch.ev_boost
    - label: Unlock
      service: lock.unlock
      target:
        entity_id: lock.ev
```

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
type: custom:hacs-home-energy-card

show_ev: input_boolean.has_ev
show_solar: input_boolean.has_solar
show_battery: input_boolean.has_battery

solar_capacity_kw: 5
battery_capacity_kwh: 13.5
show_title: false
show_daily_summary: false
show_bottom_bar: true
node_detail: minimal
card_width: 900
card_height: 506
min_width: 320
min_height: 180

labels:
  grid: Grid
  gridCard: Grid cost
  house: Home
  solar: Solar
  ev: EV
  evCard: EV
  battery: Battery

tariffs:
  currency: £
  import_rate_entity: sensor.current_import_rate
  export_rate_entity: sensor.current_export_rate

bottom_bar:
  - type: cost
    label: Grid cost
  - type: sun
  - solar
  - ev
  - battery

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

node_info:
  solar:
    entity: sensor.solar_efficiency
  ev:
    entity: sensor.ev_range
  battery:
    entity: sensor.battery_temperature

energy_today:
  grid: sensor.grid_energy_today
  solar: sensor.solar_energy_today
  home: sensor.home_energy_today

detail_entities:
  solar:
    pv_voltage: sensor.solar_pv_voltage
    pv_current: sensor.solar_pv_current
    energy_week: sensor.solar_energy_week
    energy_month: sensor.solar_energy_month
  grid:
    import_24h: sensor.grid_import_24h
    export_24h: sensor.grid_export_24h
  house:
    energy_24h: sensor.home_energy_24h
  ev:
    energy_24h: sensor.ev_energy_24h
    voltage: sensor.ev_voltage
    current: sensor.ev_current
  battery:
    voltage: sensor.battery_voltage
    current: sensor.battery_current
    charge_24h: sensor.battery_charge_24h
    discharge_24h: sensor.battery_discharge_24h
```

## No EV Example

```yaml
type: custom:hacs-home-energy-card
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
type: custom:hacs-home-energy-card
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
