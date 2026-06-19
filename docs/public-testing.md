# Public Testing

HACS Home Energy Card is ready for public testing through HACS as a custom Dashboard repository.

## Install

Use the HACS button:

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=RoBro92&repository=HACS-home-energy-card&category=dashboard)

Or add this repository manually:

```text
https://github.com/RoBro92/HACS-home-energy-card
```

Category:

```text
Dashboard
```

After installing, confirm the dashboard resource is:

```yaml
url: /hacsfiles/HACS-home-energy-card/hacs-home-energy-card.js
type: module
```

Hard refresh Home Assistant after installing or updating.

## What To Test

- Fresh install through HACS.
- Basic card using only grid and home power sensors.
- Optional solar, battery, and EV sections.
- Day and night background switching.
- Detail panels and extra sensor rows.
- Custom bottom bar cards.
- Fixed card width and height on wall panels.

## Report Feedback

Use GitHub Issues:

- Bug report for broken installs, visual bugs, or JavaScript errors.
- Public tester feedback for general install notes and setup friction.
- Feature request for future improvements.

Please include the card version, Home Assistant version, relevant YAML, and a screenshot for visual issues.
