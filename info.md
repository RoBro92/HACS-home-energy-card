# HACS Home Energy Card

<p align="center">
  <img src="docs/images/hacs-home-energy-card-logo.png" alt="HACS Home Energy Card logo" width="120">
</p>

HACS Home Energy Card is a Home Assistant dashboard card for cinematic home energy monitoring. It shows grid import and export, solar production, home load, EV charging, battery state, day and night backgrounds, animated energy direction, detail panels, and configurable glance cards.

![HACS Home Energy Card daytime full setup preview](docs/images/card-day.png)

## Public Testing

Add this repository to HACS as a custom Dashboard repository:

```text
https://github.com/RoBro92/HACS-home-energy-card
```

The Lovelace resource should be:

```yaml
url: /hacsfiles/HACS-home-energy-card/HACS-home-energy-card.js
type: module
```

Start with `entities.grid_power` and `entities.house_power`, then add solar, EV, and battery sensors when available. See `docs/setup.md` for the full configuration guide.
