# Installation

## Manual Home Assistant Install

1. Copy `energy-home-visual-card.js` to Home Assistant:

   ```text
   /config/www/energy-home-visual-card.js
   ```

2. Put the provided background images in `/config/www/`:

   ```text
   /config/www/energy-bg-full.jpg
   /config/www/energy-bg-no-ev.jpg
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

The card expects the two supplied images by default:

- `/local/energy-bg-full.jpg`
- `/local/energy-bg-no-ev.jpg`

You can override both paths in YAML with `background_full` and `background_no_ev`.
