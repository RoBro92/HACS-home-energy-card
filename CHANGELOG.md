# Changelog

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
