# Release Checklist

Before publishing a GitHub release for HACS:

- Set the GitHub repository description to: `Cinematic Home Assistant dashboard card for solar, grid, EV, and battery energy flow.`
- Add GitHub topics: `home-assistant`, `hacs`, `lovelace`, `dashboard`, `custom-card`, `energy`, `solar`, `battery`, and `ev`.
- Confirm issues and discussions are enabled.
- Confirm the repository is `RoBro92/HACS-home-energy-card`.
- Run `npm run build`.
- Run `npm run check`.
- Confirm the HACS workflow passes.
- Commit the generated `dist/` folder.
- Create a GitHub release with a version tag, for example `v1.0.2`.
- Add `RoBro92/HACS-home-energy-card` to HACS as a custom Dashboard repository.

Before submitting to default HACS:

- Confirm at least a few public testers have installed the latest release.
- Confirm the resource path is `/hacsfiles/HACS-home-energy-card/dist/hacs-home-energy-card.js`.
- Confirm bundled backgrounds load on a clean install.
- Keep the README and `info.md` focused on install, preview, and setup.
- If HACS review requests brand metadata, use `docs/images/hacs-home-energy-card-logo.svg` as the source artwork.
