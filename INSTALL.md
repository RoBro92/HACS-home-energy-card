# Installation

## HACS

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=RoBro92&repository=HACS-home-energy-card&category=dashboard)

1. Open HACS.
2. Add this repository as a custom Dashboard repository:

   ```text
   RoBro92/HACS-home-energy-card
   ```

3. Install `Energy Home Visual Card`.
4. Confirm the Lovelace resource exists:

   ```yaml
   url: /hacsfiles/HACS-home-energy-card/energy-home-visual-card.js
   type: module
   ```

5. Refresh the browser after installing or updating the card.

## Manual Install

1. Download the repository files.
2. Copy the contents of `dist/` to:

   ```text
   /config/www/energy-home-visual-card/
   ```

3. Add this Lovelace resource:

   ```yaml
   url: /local/energy-home-visual-card/energy-home-visual-card.js
   type: module
   ```

4. Add the card to a dashboard:

   ```yaml
   type: custom:energy-home-visual-card
   entities:
     grid_power: sensor.grid_power_w
     house_power: sensor.house_consumption_w
   ```

## Background Images

The bundled images load automatically from the same folder as `energy-home-visual-card.js`.

- HACS path: `/hacsfiles/HACS-home-energy-card/energy-bg-*.png`
- Manual path: `/local/energy-home-visual-card/energy-bg-*.png`

Use `backgrounds` only if you want to override the bundled images.

## Setup

See [docs/setup.md](docs/setup.md) for the full sensor list, sizing options, bottom-bar options, detail panels, and day/night switching.
