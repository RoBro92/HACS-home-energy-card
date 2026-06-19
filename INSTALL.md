# Installation

## Manual Home Assistant Install

1. Run the build locally:

   ```bash
   npm run build
   ```

2. Copy the generated `dist/` folder to Home Assistant:

   ```text
   /config/www/energy-home-visual-card/
   ```

   The folder must contain `energy-home-visual-card.js` and the bundled `energy-bg-*.png` images.

3. Add the Lovelace resource:

   ```yaml
   url: /local/energy-home-visual-card/energy-home-visual-card.js
   type: module
   ```

4. Add the card to a dashboard using one of the examples in `examples/`.

## HACS Custom Repository

1. Push this repository to GitHub.
2. Run `npm run build` and commit `dist/` before creating a release tag.
3. In HACS, add it as a custom Dashboard/Lovelace repository:

   ```text
   RoBro92/HACS-home-energy-card
   ```

4. Install it and add the resource if HACS does not add it automatically:

   ```yaml
   url: /hacsfiles/HACS-home-energy-card/energy-home-visual-card.js
   type: module
   ```

## Background Images

The bundled images load automatically from the same folder as `energy-home-visual-card.js`.

- HACS path: `/hacsfiles/HACS-home-energy-card/energy-bg-*.png`
- Manual path: `/local/energy-home-visual-card/energy-bg-*.png`

You can override paths in YAML with the `backgrounds` object. The older `background_full` and `background_no_ev` keys still work as fallbacks.
