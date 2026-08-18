# Qatar Football Koottam Finance

A mobile-first shared finance tracker using:

- GitHub Pages for free static hosting
- Supabase Postgres + Auth for online shared storage
- HTML/CSS/JavaScript frontend
- Supabase JS v2 loaded through CDN

## 1. Create Supabase project

Create a project at https://supabase.com/.

Open SQL Editor and run the complete `supabase.sql` file.

## 2. Create users

In Supabase:

Authentication → Users → Add user

Create accounts for the people who should access the app.

Use email + password. If email confirmation is enabled, confirm the users or disable confirmation for a private internal app.

## 3. Get browser credentials

In Supabase Project Settings/API, copy:

- Project URL
- Publishable key (or legacy anon key)

Do NOT use the `service_role`/secret key in the browser.

Open `app.js` and replace:

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

The publishable/anon key is designed to be used with RLS. The database policies in `supabase.sql` are what protect the tables.

## 4. Test locally

You can simply open `index.html` for a quick test, but using a local static server is more reliable.

With Python installed:

python -m http.server 8080

Then open:

http://localhost:8080

## 5. GitHub

Create a PUBLIC repository, for example:

qatar-football-koottam-finance

Upload:

index.html
styles.css
app.js
supabase.sql
README.md
.github/workflows/deploy.yml

The workflow automatically deploys the static site to GitHub Pages when you push to main.

## 6. Enable GitHub Pages

Repository → Settings → Pages

Under Build and deployment:

Source: GitHub Actions

Push to main.

The Actions workflow should run and publish the site.

Your URL will be similar to:

https://YOUR-GITHUB-USERNAME.github.io/qatar-football-koottam-finance/

## 7. Important security rule

Never put a Supabase `service_role` key in `app.js`.

Only use the publishable key/anon key.

The app requires Supabase Auth before database access. RLS allows authenticated users to access the shared football finance tables.

## 8. Current sample data

The SQL file imports:

Match #1 — 7 Aug — 14 players — QAR 140 — Ground QAR 150
Match #2 — 12 Aug — 19 players — QAR 190 — Ground QAR 150 — Water QAR 12
Match #3 — 14 Aug — 15 players — QAR 150 — Ground QAR 100

It also creates ledger entries that reconcile the example sheet to:

Jaseel — QAR 60
Nashid — QAR 18
Total — QAR 78

The historical adjustments are explicitly labeled so you can remove/replace them once the real ledger is entered.

## 9. Production recommendation

For a larger group, tighten RLS so only an admin can edit members/settings and only approved members can edit finance records.

For this small private group, the supplied policies allow any authenticated user to manage the shared finance records.
