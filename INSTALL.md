# Install

## HACS

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=RoBro92&repository=HACS-home-energy-card&category=dashboard)

1. Open HACS.
2. Add `RoBro92/HACS-home-energy-card` as a custom Dashboard repository.
3. Install HACS Home Energy Card.
4. Hard refresh Home Assistant.

HACS should add this dashboard resource automatically:

```yaml
url: /hacsfiles/HACS-home-energy-card/hacs-home-energy-card.js
type: module
```

If the card does not appear in the card picker, check the resource above exists under Home Assistant dashboard resources, then refresh the browser cache. You can still add it with a manual card:

```yaml
type: custom:hacs-home-energy-card
entities:
  grid_power: sensor.grid_power_w
  house_power: sensor.house_consumption_w
```

## Manual

1. Copy the contents of `dist/` to `/config/www/hacs-home-energy-card/`.
2. Add this resource:

```yaml
url: /local/hacs-home-energy-card/hacs-home-energy-card.js
type: module
```

3. Add the manual card YAML shown above.

The bundled background images must stay in the same folder as `hacs-home-energy-card.js`.
