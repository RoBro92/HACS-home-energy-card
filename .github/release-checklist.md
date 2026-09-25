# Release Checklist

Releases are published by the Release workflow. The release tag is always `v` plus the `version` in `package.json`.

1. Bump `version` in `package.json` and add a `## <version>` section to `CHANGELOG.md`.
2. Run `npm ci`, `npm run build`, and `npm run check`. Commit the regenerated `dist/`.
3. Merge to `main` and confirm the Validate and HACS workflows pass.
4. Start the release, either way works:

   - **From GitHub:** Actions > Release > Run workflow, branch `main`. Or from a terminal with the GitHub CLI:

     ```sh
     gh workflow run release.yml --ref main
     ```

   - **By tag:**

     ```sh
     git fetch origin main
     git tag -a v1.2.3 -m "v1.2.3" origin/main
     git push origin v1.2.3
     ```

The workflow rebuilds, checks that the committed `dist/` matches the source, and creates the GitHub release with the matching changelog section as its notes. A manual run creates the tag on the `main` commit it ran against, and refuses to run if that tag already exists, so a forgotten version bump fails instead of overwriting a release.

Do not attach a `.js` asset to the release: HACS would then download only that file and skip the bundled backgrounds. HACS reads `dist/` from the tagged tree.

## How HACS picks this up

- `hacs.json` names `HACS-home-energy-card.js`. HACS finds it under `dist/` at the newest release tag and downloads every file in that folder.
- The dashboard resource is `/hacsfiles/HACS-home-energy-card/HACS-home-energy-card.js`.
- HACS renders `info.md` on the repository page. The README is for GitHub.

Before submitting to default HACS: confirm a few public testers have installed the latest release on a clean install, and keep `info.md` focused on install and setup.
