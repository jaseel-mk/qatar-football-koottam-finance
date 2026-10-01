# QFK Matchday Studio

Open studio/index.html from the hosted Finance site, or use the Matchday Studio sidebar link. Serve the repository through an HTTP server for local previews.

The module contains the Match, Lineup and Poster workflow with player creation, team assignments, formations, substitutes, five poster themes, ordered/random theme selection and 2400 x 3200 PNG export. Poster names, numbers, positions and match details come from the builder.

This version stores Studio data in the browser under qfk-matchday-studio-local-v1. Save Formation saves the match; Export Studio Backup downloads a separate backup. Shared database storage is not connected yet. matchday-schema-DRAFT.sql is an unapplied design draft; do not run it as a production migration.

Finance scripts, calculations and database tables are unchanged. The root index.html only adds a link to this independent module.

Run verification from the repository root:

    node --test backup.test.cjs reports.test.cjs studio/model.test.cjs studio/poster.test.cjs

The five active themes are Heritage, Midnight Doha, Royal Clash, Pearl Qatar and Emerald Arena. Stadium artwork and jersey/turf textures are local assets; editable text and lineup details are rendered separately.
