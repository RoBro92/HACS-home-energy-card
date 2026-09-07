# Changelog

## 1.1.0

Focus release: fewer options, a smoother first run, and glance cards that put the number first.

- Adds a sectioned visual editor. Setup holds the two required sensors and the system toggles; Solar, Battery, and EV sections appear only when switched on; energy, cost, bottom bar, and appearance each get their own panel with helper text under the fields.
- Adds detail panel extras as a multi entity picker. `detail_entities` now accepts a plain list of entity IDs, and rows are named after the entity.
- Adds custom entity cards to the bottom bar editor, with entity and label fields.
- Adds `tariff_now`, `home_today`, `solar_today`, `ev_today`, and `battery_charge` glance cards, plus `energy_today.ev` and `energy_today.battery_charge`.
- Adds a data aware default bottom bar. With no `bottom_bar` configured the card shows only the glance cards it has sensors for.
- Adds sensor guessing when the card is added from the picker, using power and battery device classes.
- Adds a first run hint in place of the nodes until grid and home power are set. `setConfig` no longer throws for an incomplete config, so the editor preview keeps working.
- Reworks the glance cards so the value is the headline and the caption sits underneath. Labels use sentence case.
- Adds a direction line with a colour matched dot to every node, and a soft breathing ring while power is flowing. Reduced motion is respected.
- Adds a crossfade between backgrounds when the scene changes between day and night or between setups.
- Adds a `getGridOptions` hint so the card spans a full section width.
- Replaces viewport media queries with container queries so a narrow column on a wide screen gets the compact layout.
- Removes the title, subtitle, and daily summary strip and the `show_title`, `show_daily_summary`, `title`, `subtitle`, and `node_detail` options. Nodes always show their direction line and the summary values live in the glance bar and detail panels.
- Removes undocumented camelCase and alias config keys, `bottom_bar_limit`, and the animated flow model that was no longer rendered. Documented aliases `backgrounds.no_ev`, `backgrounds.no_solar_battery`, `background_full`, and `background_no_ev` still work.
- Removes the `/local/energy-bg-*.jpg` fallback. Missing background keys now fall back to the bundled images.
- Bundles lit into `dist/HACS-home-energy-card.js` at build time. The card no longer fetches lit from a CDN when it loads, so it works on installs without internet access. `npm ci` is now required before `npm run build`.
- Adds a Release workflow: pushing a matching `v*` tag builds, verifies the committed `dist/`, and publishes the GitHub release with the changelog section as notes. The validate workflow now fails when `dist/` is stale.
- Logs the card version to the browser console on load, so support reports can name the installed release.
- Trims the README to install, preview, quick start, and links; the full option reference lives in the setup guide.
- Drops `time_of_day` from the stub config so a card added from the picker follows the sun instead of being locked to day.


## 1.0.11

- Replaces the duplicate bottom node pills with configurable bottom glance cards.
- Adds bottom bar types for cost today, cost now, self powered today, grid import/export, battery reserve, battery discharge, sun state, weather, and custom entities.
- Adds daily cost budget progress support through `costs.today_entity` and `costs.daily_budget`.
- Adds visual editor controls for five bottom bar slots and the supporting cost, grid, battery, weather, and temperature entities.
- Removes the visible dashed energy path overlay from the card.
- Updates the demo, examples, setup guide, and screenshots for public testing.

## 1.0.10

- Regroups the visual editor into Card, Grid And Home, Solar, EV, Battery, and Cost sections.
- Keeps all EV, Solar, and Battery fields together so users do not have to jump between generic sensor and detail sections.

## 1.0.9

- Rounds odometer detail readings to the nearest whole mile while preserving the sensor unit.

## 1.0.8

- Hides solar, EV, and battery related visual editor fields when their matching `show_*` toggle is set to `false`.
- Preserves hidden YAML values so users can turn a system back on without re-entering sensors.

## 1.0.7

- Adds automatic detail panel controls for lock, switch, button, and input button entities added under `detail_entities`.
- Supports extra EV popup rows such as range, inside temperature, odometer, and any other user supplied entity.
- Improves desktop detail panel contrast so title, values, and the close button remain visible without hover.
- Adjusts narrow preview node positions so the card picker and visual editor preview do not overlap as easily.
- Updates setup examples with clearer sections for setup toggles, main sensors, node extras, popup details, and controls.

## 1.0.6

- Replaces the blank custom editor fields with native Home Assistant form selectors and entity dropdowns.
- Prevents duplicate card picker entries when Home Assistant loads the module more than once.
- Improves small preview layouts in the card picker and editor modal.
- Lightens the day overlay so the base no EV, no solar, and no battery setup does not appear black.

## 1.0.5

- Renames the packaged `dist` module to `HACS-home-energy-card.js` so HACS can find a plugin file matching the repository name exactly.
- Updates HACS metadata and resource documentation to use the case matching file served by HACS.

## 1.0.4

- Fixes the HACS resource path so Home Assistant loads `hacs-home-energy-card.js` from the path HACS serves.
- Updates setup, install, preview, and public testing docs to remove the incorrect `/dist/` resource URL.
- Keeps the packaged card and bundled background images in `dist` for HACS release discovery.

## 1.0.3

- Removes the logo from the top of the main README while keeping logo assets available for HACS and brand use.
- Changes the first preview image to the daytime full setup card with EV, solar, and battery.
- Improves Home Assistant card picker metadata with preview support and documentation link.
- Updates the card stub config so the Community Card preview renders the full daytime setup.
- Simplifies install guidance for public testers.

## 1.0.2

- Adds HACS validation workflow for default HACS readiness.
- Adds public tester issue templates and setup notes.
- Adds local logo artwork for the README and HACS detail view.
- Tightens the HACS preview content and repository metadata for public testing.

## 1.0.1

- Fixes bundled background loading for HACS installs that serve the card JavaScript from the repository root while images are stored in `dist`.
- Points the HACS manifest and HACS resource examples at the `dist` card file so bundled images sit next to the running module.
- Publishes the HACS release as a zip package with the card JavaScript and bundled image files together.

## 1.0.0

- Simplifies the default card layout by hiding the top daily summary strip and using compact floating live nodes.
- Adds in card detail panels for grid, solar, home, EV, and battery.
- Adds optional `detail_entities` rows for extra voltage, current, and energy total sensors.
- Adds visible animated energy paths with directional pulse markers.
- Hides the optional top left title by default and title cases visible status labels.
- Adds README screenshots generated from the live demo.
- Adds configurable node labels, optional node extra values, custom bottom bar cards, grid cost and tariff support, and detail panel quick actions.
- Adds optional `card_width`, `card_height`, `min_width`, and `min_height` sizing controls.
- Adds the `custom:hacs-home-energy-card` Lovelace card.
- Ships setup aware day and night backgrounds for EV, solar, and battery combinations.
- Supports module relative default backgrounds when installed through HACS.
