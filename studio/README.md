# QFK Matchday Studio

Open studio/index.html from the Finance site or its Matchday Studio sidebar link.

## Database storage

Studio players, matches, formations, team assignments and poster snapshots are saved to Supabase with Save Formation. The independent qfk_matchday_workspace_v1 table stores the entire Studio workspace atomically. Finance tables, calculations, policies and records are unchanged.

Run matchday-database.sql once in the existing QFK Supabase SQL Editor before using this version. This migration has been applied to the current QFK project. Do not run matchday-schema-DRAFT.sql; it is an earlier unapplied design.

This follows the existing trusted-group workflow without a login or admin menu. The app's public key permits reading and saving Studio data. Keep financial and other sensitive data out of Studio.

Every page loads the database first. Save success appears only after the server confirms it. A local cache and JSON export provide backup; browser storage is not the primary store. Existing browser data is preserved and can be added with Import previous browser data on the same browser and URL origin. Imports reject conflicting IDs or duplicate match numbers instead of replacing existing records.

Concurrent devices use revision checks. If another device saves first, export your unsaved edits, reload, then reapply them to the newer data. Failed saves retain edits and offer retry. No automatic overwrite or fallback to browser-only editing occurs.

## Posters and verification

The Match, Lineup and Poster workflow supports player creation, assignments, substitutes, saved formations, five poster themes, ordered/random selection and high-resolution PNG export. Names, numbers, positions and match details come from the builder. Themes: Heritage, Midnight Doha, Royal Clash, Pearl Qatar and Emerald Arena. Stored poster previews are rebuilt from snapshots.

Serve the repository through an HTTP server for local previews. Run from the repository root:

    node --test backup.test.cjs reports.test.cjs studio/model.test.cjs studio/poster.test.cjs studio/database.test.cjs

Database saving belongs to the feature branch until it is merged. GitHub Pages publishes main.
