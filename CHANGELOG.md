# Changelog

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
