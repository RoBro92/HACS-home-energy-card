# HACS Home Energy Card Setup

This card can be configured from the Home Assistant visual card editor or with YAML. Everything in the editor has a YAML key, and a few YAML only extras such as helper entities for the setup toggles and custom detail labels are covered below.

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

## First Run

1. Edit the dashboard and add **HACS Home Energy Card**.
2. The card tries to pick grid, home, solar, battery, and EV sensors from what your instance already has, using their power and battery device classes. Check the two sensors under **Setup** and correct them if needed.
3. Until grid power and home power are both set the card shows a short hint in place of the nodes.
4. Switch on **Solar**, **Battery**, and **EV** for the systems you have. A section for each appears underneath.

The editor is split into sections:

| Section | What lives there |
| --- | --- |
| Setup | Grid power, home power, and the three system toggles. |
| Solar, Battery, EV | Shown only when that system is on. Live sensors, capacity, daily totals, an extra node value, and detail panel extras. |
| Grid and home energy | Daily import, export, and home totals for the glance cards and detail panels. |
| Cost and tariff | Currency, cost today, budget, and live or fixed rates. |
| Bottom bar | Up to five glance cards. Custom entity cards get an entity and label field. |
| Appearance | Node labels, sun entity, day or night lock, weather, and a fixed pixel size. |

Turning a system off hides its section but keeps the YAML, so switching it back on restores every sensor.

## Setup Toggles

`show_ev`, `show_solar`, and `show_battery` accept `true`, `false`, or a helper entity:

```yaml
show_ev: input_boolean.has_ev
show_solar: true
show_battery: input_boolean.has_battery
```

Helper entities are useful when one dashboard card serves several homes. Entity states `on`, `true`, `home`, `charging`, `plugged_in`, and `connected` count as on.

## Required Sensors

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.grid_power` | W | Positive values import from the grid. Negative values export. |
| `entities.house_power` | W | Current home consumption. |

## Solar

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.solar_power` | W | Current solar production. |
| `solar_capacity_kw` | kW | Array size, for example `5`. Gives the efficiency percentage shown on the node. |
| `entities.solar_capacity` | kW or W | Sensor alternative to `solar_capacity_kw`. |
| `energy_today.solar` | kWh | Generated today, for the `solar_today` card and the detail panel. |

## Battery

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.battery_power` | W | Positive values charge the battery. Negative values discharge it. |
| `entities.battery_soc` | % | State of charge. |
| `battery_capacity_kwh` | kWh | Capacity, for example `13.5`. Gives the reserve estimate. |
| `entities.battery_capacity` | kWh or Wh | Sensor alternative to `battery_capacity_kwh`. |
| `energy_today.battery_charge` | kWh | Charged today. |
| `energy_today.battery_discharge` | kWh | Discharged today. |

## EV

| Field | Unit | Notes |
| --- | --- | --- |
| `entities.ev_power` | W | Charge power. Negative values are treated as vehicle to home discharge. |
| `entities.ev_soc` | % | State of charge. |
| `entities.ev_charging_state` | state or binary | `on`, `true`, or `charging` shows as charging. `off`, `false`, or `not_charging` shows as not charging. Other states are shown as readable text. |
| `energy_today.ev` | kWh | Charged today. |

## Grid And Home Energy

```yaml
energy_today:
  grid_import: sensor.grid_import_today
  grid_export: sensor.grid_export_today
  home: sensor.home_energy_today
  grid: sensor.grid_energy_today
```

`grid_import` and `home` drive the `self_powered_today` card. `grid_import` and `grid_export` drive the `grid_import_export` card. `grid` is a net figure shown in the grid detail panel only.

## Cost And Tariff

```yaml
tariffs:
  currency: £
  import_rate_entity: sensor.current_import_rate
  export_rate_entity: sensor.current_export_rate
  import_rate: 0.34
  export_rate: 0.15

costs:
  today_entity: sensor.energy_cost_today
  daily_budget: 5
```

Rate sensors win over fixed rates when both are set, which suits time of use tariffs. The `cost_now` card multiplies the current grid power by the matching rate, and `tariff_now` shows the rates themselves. `costs.daily_budget` is optional and fills the `cost_today` progress bar.

## Bottom Bar

Choose up to five glance cards. Leave `bottom_bar` out and the card shows the ones it has data for, in this order: cost today, self powered, grid import and export, battery reserve, solar today, grid cost, EV today, home today, then sunrise or sunset.

```yaml
bottom_bar:
  - type: cost_today
  - type: self_powered_today
  - type: grid_import_export
  - type: battery_reserve
  - type: weather
```

| Type | Shows | Needs |
| --- | --- | --- |
| `cost_today` | Spend so far today, with a budget bar | `costs.today_entity`, optional `costs.daily_budget` |
| `cost_now` | Import cost or export credit per hour | `entities.grid_power` and a tariff rate |
| `tariff_now` | Current import rate, with the export rate as caption | a tariff rate |
| `self_powered_today` | Share of home use not imported | `energy_today.home`, `energy_today.grid_import` |
| `grid_import_export` | Import and export today | `energy_today.grid_import`, `energy_today.grid_export` |
| `home_today` | Home energy used today | `energy_today.home` |
| `solar_today` | Solar generated today | `energy_today.solar` |
| `ev_today` | EV energy charged today | `energy_today.ev` |
| `battery_reserve` | Hours of battery left at the current home load | `entities.battery_soc`, a capacity |
| `battery_charge` | Battery charged today | `energy_today.battery_charge` |
| `battery_discharge` | Battery discharged today | `energy_today.battery_discharge` |
| `sun` | Next sunset or sunrise | `entities.sun` |
| `weather` | Temperature and conditions | `entities.weather`, optional `entities.outdoor_temperature` |
| `entity` | Any entity | `entity`, `label`, optional `status`, `icon`, `color` |

Solar, EV, and battery cards disappear when that system is off. Any card can be renamed or re-iconed in YAML:

```yaml
bottom_bar:
  - type: cost_today
    label: Spend
  - type: entity
    label: Water
    status: Today
    entity: sensor.water_usage_today
    icon: mdi:water
```

The legacy `grid`, `solar`, `house`, `ev`, `battery`, and `cost` types still work, but they repeat the node values.

## Detail Panels

Tapping a node or glance card opens a panel with the core values for that group. `detail_entities` adds rows and controls. The simplest form is a list of entity IDs, which is what the editor writes:

```yaml
detail_entities:
  solar:
    - sensor.solar_pv_voltage
    - sensor.solar_pv_current
    - sensor.solar_energy_week
  ev:
    - sensor.ev_range
    - sensor.ev_odometer
    - lock.ev
```

Rows are named after the entity. Lock, switch, button, and input button entities become circular controls at the bottom of the panel: a locked lock shows an **Unlock** button, a switch toggles. Use the keyed form for a custom label or icon:

```yaml
detail_entities:
  ev:
    range: sensor.ev_range
    boost:
      label: Boost
      entity: switch.ev_boost
      icon: mdi:flash
```

Known keys such as `pv_voltage`, `energy_week`, or `import_24h` get tidy labels. Unknown keys are converted, so `inverter_temperature` displays as `Inverter Temperature`. Sensor rows open the Home Assistant more info dialog when tapped.

For custom service calls use `actions`:

```yaml
actions:
  ev:
    - label: Boost charge
      service: switch.turn_on
      target:
        entity_id: switch.ev_boost
```

## Nodes And Labels

Every node shows its live power and a direction line: importing or exporting, producing, consuming, charging or discharging, with a colour matched dot. Nodes with power flowing carry a soft breathing ring; the ring is static when the browser asks for reduced motion.

Add one compact extra value to any node with `node_info`, and rename nodes with `labels`:

```yaml
node_info:
  solar:
    entity: sensor.inverter_temperature
  ev:
    entity: sensor.ev_range

labels:
  grid: Grid
  house: Home
  solar: Solar
  ev: Car
  battery: Battery
```

`labels.gridCard` and `labels.evCard` rename only the detail panel titles, which default to `Electricity` and `Electric Vehicle`.

## Day And Night

The scene follows `entities.sun`, which defaults to `sun.sun`, and crossfades when the sun crosses the horizon. To lock the scene or drive it from another entity:

```yaml
time_of_day: night
# or
time_of_day: binary_sensor.daylight
```

Accepted day states are `above_horizon`, `day`, `sunny`, `on`, and `true`. Accepted night states are `below_horizon`, `night`, `off`, and `false`.

## Sizing

Leave `card_width` and `card_height` blank for a responsive card that fills the dashboard column. Set both for a wall panel or kiosk:

```yaml
card_width: 900
card_height: 506
min_width: 320
min_height: 180
```

If only `card_width` is set the card keeps its scene aspect ratio. With both set the scene scales into that exact box. The layout adapts to the card width, not the browser width, so a narrow column on a wide screen gets the compact nodes and glance bar.

## Background Selection

The card picks one of the bundled day and night images for the active setup:

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

Override any of them with `backgrounds.<setup>.day` and `.night`. Missing keys fall back to the bundled images.

## Full Example

See [examples/dashboard.yaml](../examples/dashboard.yaml) for a full setup and [examples/dashboard-no-ev.yaml](../examples/dashboard-no-ev.yaml) for solar and battery only. A minimal card is just:

```yaml
type: custom:hacs-home-energy-card
entities:
  grid_power: sensor.grid_power_w
  house_power: sensor.house_consumption_w
```
