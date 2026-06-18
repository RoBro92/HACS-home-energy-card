# Installation

## Manual Home Assistant Install

1. Copy `energy-home-visual-card.js` to Home Assistant:

   ```text
   /config/www/energy-home-visual-card.js
   ```

2. Put the provided background images in `/config/www/`:

   ```text
   /config/www/energy-bg-full-day.png
   /config/www/energy-bg-full-night.png
   /config/www/energy-bg-ev-solar-day.png
   /config/www/energy-bg-ev-solar-night.png
   /config/www/energy-bg-ev-battery-day.png
   /config/www/energy-bg-ev-battery-night.png
   /config/www/energy-bg-no-ev-day.png
   /config/www/energy-bg-no-ev-night.png
   /config/www/energy-bg-no-solar-battery-day.png
   /config/www/energy-bg-no-solar-battery-night.png
   /config/www/energy-bg-solar-only-day.png
   /config/www/energy-bg-solar-only-night.png
   /config/www/energy-bg-battery-only-day.png
   /config/www/energy-bg-battery-only-night.png
   /config/www/energy-bg-base-day.png
   /config/www/energy-bg-base-night.png
   ```

3. Add the Lovelace resource:

   ```yaml
   url: /local/energy-home-visual-card.js
   type: module
   ```

4. Add the card to a dashboard using one of the examples in `examples/`.

## HACS Custom Repository

1. Push this repository to Gitea or GitHub.
2. In HACS, add it as a custom repository with category `Lovelace`.
3. Install it and add the resource if HACS does not add it automatically:

   ```yaml
   url: /hacsfiles/energy-home-visual-card/energy-home-visual-card.js
   type: module
   ```

## Background Images

The card can use a setup-aware background matrix:

- `/local/energy-bg-full-day.png`
- `/local/energy-bg-full-night.png`
- `/local/energy-bg-ev-solar-day.png`
- `/local/energy-bg-ev-solar-night.png`
- `/local/energy-bg-ev-battery-day.png`
- `/local/energy-bg-ev-battery-night.png`
- `/local/energy-bg-no-ev-day.png`
- `/local/energy-bg-no-ev-night.png`
- `/local/energy-bg-no-solar-battery-day.png`
- `/local/energy-bg-no-solar-battery-night.png`
- `/local/energy-bg-solar-only-day.png`
- `/local/energy-bg-solar-only-night.png`
- `/local/energy-bg-battery-only-day.png`
- `/local/energy-bg-battery-only-night.png`
- `/local/energy-bg-base-day.png`
- `/local/energy-bg-base-night.png`

You can override paths in YAML with the `backgrounds` object. The older `background_full` and `background_no_ev` keys still work as fallbacks.
