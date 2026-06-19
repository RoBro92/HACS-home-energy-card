# Release Checklist

Before publishing a GitHub release for HACS:

- Set the GitHub repository description to: `A cinematic Home Assistant Lovelace energy flow card.`
- Add GitHub topics: `home-assistant`, `hacs`, `lovelace`, `custom-card`, `energy`.
- Confirm the repository is `RoBro92/HACS-home-energy-card`.
- Run `npm run build`.
- Run `npm run check`.
- Commit the generated `dist/` folder.
- Create a GitHub release with a version tag, for example `v0.1.0`.
- Add `RoBro92/HACS-home-energy-card` to HACS as a custom Dashboard/Lovelace repository.
