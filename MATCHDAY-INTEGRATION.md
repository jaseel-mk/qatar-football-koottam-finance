# Matchday Studio integration

The Finance sidebar opens `matchday/index.html`, the cloud-backed formation module. The previous browser-local studio remains under `studio/index.html` and is linked from the new module's footer. Existing local backups and browser storage retain their original keys.

## Included

- Match creation, two teams, reusable formations, poster previews and SVG exports.
- Player library and adding players directly to a lineup.
- Side-by-side players and pitches at tablet/desktop widths, pointer drag assignment, swaps and substitutes.
- 16 templates for 5-, 6-, 7- and 8-a-side, including goalkeeper coordinates.
- Correct Supabase relation aliases for teams and formation positions.

## Data and deployment

The module uses the formation Supabase project already configured for this task (`avbcoaheneurcxbthmvh`). Finance continues to use its existing project (`soakyzawpmsoxqodskgr`). Financial matches/members and formation matches/players are currently independent. There is no automatic member import, match synchronization or change to finance totals.

`matchday/config.js` contains only the public project URL and publishable key. Edit `matchday-studio/public/config.js` and rebuild to change the project permanently. Never insert secret or service-role credentials.

The schema and 16 templates are already installed in the configured formation project. For a different database, run `migrations/matchday-formation-schema.sql`, then `migrations/matchday-general-formations.sql`. These scripts are not applied automatically. Their anonymous read/write policies match the explicitly approved access model of this formation app. Review access before using another project's database.

The compiled `matchday/` folder is committed so the existing static/GitHub Pages deployment can serve it. Publish the entire repository, including both `matchday/` and `studio/`. Relative asset URLs support repository subpaths.

## Rebuild

With Node.js and npm installed:

```sh
cd matchday-studio
npm ci
npm run typecheck
npm run build
```

Commit updated source and compiled output together. Build output preserves files in `matchday/`; remove obsolete hashed asset files when replacing a build. No `.env.local`, node_modules or private credentials are committed.

## Validation

```sh
node --test backup.test.cjs reports.test.cjs studio/model.test.cjs studio/poster.test.cjs matchday-integration.test.cjs
```

Serve the repository using a static HTTP server and open `/index.html`. Use the sidebar's Matchday Studio link. In the new module, Edit a match to select each team's formation, then Build to drag players onto slots. Save Formation persists the lineup to the formation project.
