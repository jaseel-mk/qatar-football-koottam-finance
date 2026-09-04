# Qatar Football Koottam Finance

A lightweight Supabase-backed finance tracker for Qatar Football Koottam.

## Modified user flow

Supabase Authentication has been removed. When the site opens, the user sees **Who are you?** and selects their member name. If their name is missing, they can choose **+ My name is not listed**, enter their name, and continue. The name is added to the `members` table automatically.

The selected member is stored in the browser's local storage and is used to populate audit fields such as `created_by`, `updated_by`, and `deleted_by`.

> Important: this member selector is not secure authentication. Anyone who can open the app can choose another member's name. Use it only as a simple activity label for a trusted/private group.

## Files

- `index.html` — application layout and Who are you? screen
- `styles.css` — Qatar maroon UI styling
- `app.js` — Supabase data operations, user selection, finance calculations and audit tracking
- `supabase.sql` — database schema, migration, RLS policies, grants and sample data
- `reset.html` — legacy compatibility page; password reset is no longer used

## Setup / upgrade

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Run the complete `supabase.sql` file once. It is safe to run against the existing database because it uses `IF NOT EXISTS` and migration statements.
4. Upload/replace `index.html`, `styles.css`, and `app.js` in your GitHub Pages repository.
5. Hard refresh the website.
6. Select your name on the Who are you? screen.

## Audit fields

The four main tables contain:

- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `deleted_at`
- `deleted_by`

Matches, expenses and cash transactions use soft deletion. Deleted records remain in Supabase for audit history but are excluded from the live UI and finance totals.

Members are deactivated rather than physically deleted so historical expense and cash references remain valid.

## Security note

The frontend uses a Supabase publishable/anon key. Because authentication was intentionally removed, the modified RLS policies permit the `anon` role to read and write the finance tables. Do not use a Supabase `service_role` key in `app.js`.
