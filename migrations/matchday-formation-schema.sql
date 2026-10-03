/*
# QFK Formation Setup — Core Tables

Creates the full Formation Setup module schema: master players, saved formations
with visual position coordinates, matches with two teams, match-specific player
lineup (separate from master profile), and poster version history.

## 1. New Tables

### qfk_players
Master player/member records, reusable across all matches.
- id (uuid PK)
- name (text, not null)
- jersey_number (int, nullable — match-specific numbers override this)
- avatar_url (text, nullable)
- phone (text, nullable)
- is_active (boolean, default true)
- created_at / updated_at (timestamps)

### qfk_saved_formations
Reusable formation templates with visual position coordinates.
- id (uuid PK)
- name (text, not null) — display name e.g. "3-3-1"
- code (text, not null) — short code e.g. "3-3-1"
- is_active (boolean, default true)
- created_at / updated_at

### qfk_formation_positions
Position slots within a saved formation, stored as percentage coordinates.
- id (uuid PK)
- formation_id (FK -> qfk_saved_formations, CASCADE)
- position_code (text, e.g. "ST", "CM", "GK")
- label (text, display label)
- x (numeric 0-100, percentage across pitch width)
- y (numeric 0-100, percentage down pitch height)
- display_order (int, ordering)

### qfk_matches
Match records with metadata and poster theme selection.
- id (uuid PK)
- match_number (int, not null)
- match_date (date, not null)
- start_time (text, not null)
- end_time (text, not null)
- venue (text, not null)
- title (text, not null)
- description (text, nullable)
- poster_theme (text, default 'auto')
- status (text, default 'draft' — draft/ready/confirmed/archived)
- created_at / updated_at

### qfk_match_teams
Two team configs per match (sides A and B).
- id (uuid PK)
- match_id (FK -> qfk_matches, CASCADE)
- side (text, 'A' or 'B')
- name (text)
- primary_color (text, hex)
- secondary_color (text, hex)
- text_color (text, hex)
- goalkeeper_color (text, hex)
- formation_id (FK -> qfk_saved_formations, nullable)

### qfk_match_players
Match-specific lineup entries linking master players to a match team.
Separates match data from master profile — a player can have different
positions/jersey numbers in different matches.
- id (uuid PK)
- match_id (FK -> qfk_matches, CASCADE)
- match_team_id (FK -> qfk_match_teams, CASCADE)
- player_id (FK -> qfk_players, CASCADE)
- name_snapshot (text — editable display name for this match)
- jersey_number (int)
- position (text, e.g. "ST")
- position_slot_index (int, which formation slot this player fills)
- status (text: 'starter' / 'substitute' / 'unassigned')
- display_order (int)

### qfk_poster_versions
Poster generation history per match.
- id (uuid PK)
- match_id (FK -> qfk_matches, CASCADE)
- theme (text)
- file_path (text, nullable — Supabase Storage path)
- is_active (boolean, default false)
- created_at

## 2. Security
- Single-tenant app (no auth screen). All policies use `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` since data is intentionally shared.
- RLS enabled on every table.
*/

-- Master players
CREATE TABLE IF NOT EXISTS qfk_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  jersey_number int,
  avatar_url text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE qfk_players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qfk_players_select" ON qfk_players;
CREATE POLICY "qfk_players_select" ON qfk_players FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "qfk_players_insert" ON qfk_players;
CREATE POLICY "qfk_players_insert" ON qfk_players FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_players_update" ON qfk_players;
CREATE POLICY "qfk_players_update" ON qfk_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_players_delete" ON qfk_players;
CREATE POLICY "qfk_players_delete" ON qfk_players FOR DELETE TO anon, authenticated USING (true);

-- Saved formations
CREATE TABLE IF NOT EXISTS qfk_saved_formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE qfk_saved_formations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qfk_formations_select" ON qfk_saved_formations;
CREATE POLICY "qfk_formations_select" ON qfk_saved_formations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "qfk_formations_insert" ON qfk_saved_formations;
CREATE POLICY "qfk_formations_insert" ON qfk_saved_formations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_formations_update" ON qfk_saved_formations;
CREATE POLICY "qfk_formations_update" ON qfk_saved_formations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_formations_delete" ON qfk_saved_formations;
CREATE POLICY "qfk_formations_delete" ON qfk_saved_formations FOR DELETE TO anon, authenticated USING (true);

-- Formation positions
CREATE TABLE IF NOT EXISTS qfk_formation_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES qfk_saved_formations(id) ON DELETE CASCADE,
  position_code text NOT NULL,
  label text NOT NULL,
  x numeric NOT NULL DEFAULT 50 CHECK (x >= 0 AND x <= 100),
  y numeric NOT NULL DEFAULT 50 CHECK (y >= 0 AND y <= 100),
  display_order int NOT NULL DEFAULT 0
);

ALTER TABLE qfk_formation_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qfk_form_pos_select" ON qfk_formation_positions;
CREATE POLICY "qfk_form_pos_select" ON qfk_formation_positions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "qfk_form_pos_insert" ON qfk_formation_positions;
CREATE POLICY "qfk_form_pos_insert" ON qfk_formation_positions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_form_pos_update" ON qfk_formation_positions;
CREATE POLICY "qfk_form_pos_update" ON qfk_formation_positions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_form_pos_delete" ON qfk_formation_positions;
CREATE POLICY "qfk_form_pos_delete" ON qfk_formation_positions FOR DELETE TO anon, authenticated USING (true);

-- Matches
CREATE TABLE IF NOT EXISTS qfk_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number int NOT NULL,
  match_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  venue text NOT NULL,
  title text NOT NULL,
  description text,
  poster_theme text NOT NULL DEFAULT 'auto',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE qfk_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qfk_matches_select" ON qfk_matches;
CREATE POLICY "qfk_matches_select" ON qfk_matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "qfk_matches_insert" ON qfk_matches;
CREATE POLICY "qfk_matches_insert" ON qfk_matches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_matches_update" ON qfk_matches;
CREATE POLICY "qfk_matches_update" ON qfk_matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_matches_delete" ON qfk_matches;
CREATE POLICY "qfk_matches_delete" ON qfk_matches FOR DELETE TO anon, authenticated USING (true);

-- Match teams
CREATE TABLE IF NOT EXISTS qfk_match_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES qfk_matches(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('A', 'B')),
  name text NOT NULL DEFAULT 'Team A',
  primary_color text NOT NULL DEFAULT '#1746D1',
  secondary_color text NOT NULL DEFAULT '#F7F5EE',
  text_color text NOT NULL DEFAULT '#FFFFFF',
  goalkeeper_color text NOT NULL DEFAULT '#141820',
  formation_id uuid REFERENCES qfk_saved_formations(id) ON DELETE SET NULL
);

ALTER TABLE qfk_match_teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qfk_match_teams_select" ON qfk_match_teams;
CREATE POLICY "qfk_match_teams_select" ON qfk_match_teams FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "qfk_match_teams_insert" ON qfk_match_teams;
CREATE POLICY "qfk_match_teams_insert" ON qfk_match_teams FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_match_teams_update" ON qfk_match_teams;
CREATE POLICY "qfk_match_teams_update" ON qfk_match_teams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_match_teams_delete" ON qfk_match_teams;
CREATE POLICY "qfk_match_teams_delete" ON qfk_match_teams FOR DELETE TO anon, authenticated USING (true);

-- Match players (lineup)
CREATE TABLE IF NOT EXISTS qfk_match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES qfk_matches(id) ON DELETE CASCADE,
  match_team_id uuid REFERENCES qfk_match_teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES qfk_players(id) ON DELETE CASCADE,
  name_snapshot text NOT NULL,
  jersey_number int NOT NULL DEFAULT 0,
  position text NOT NULL DEFAULT 'GK',
  position_slot_index int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unassigned' CHECK (status IN ('starter', 'substitute', 'unassigned')),
  display_order int NOT NULL DEFAULT 0
);

ALTER TABLE qfk_match_players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qfk_match_players_select" ON qfk_match_players;
CREATE POLICY "qfk_match_players_select" ON qfk_match_players FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "qfk_match_players_insert" ON qfk_match_players;
CREATE POLICY "qfk_match_players_insert" ON qfk_match_players FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_match_players_update" ON qfk_match_players;
CREATE POLICY "qfk_match_players_update" ON qfk_match_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_match_players_delete" ON qfk_match_players;
CREATE POLICY "qfk_match_players_delete" ON qfk_match_players FOR DELETE TO anon, authenticated USING (true);

-- Poster versions
CREATE TABLE IF NOT EXISTS qfk_poster_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES qfk_matches(id) ON DELETE CASCADE,
  theme text NOT NULL,
  file_path text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE qfk_poster_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qfk_poster_versions_select" ON qfk_poster_versions;
CREATE POLICY "qfk_poster_versions_select" ON qfk_poster_versions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "qfk_poster_versions_insert" ON qfk_poster_versions;
CREATE POLICY "qfk_poster_versions_insert" ON qfk_poster_versions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_poster_versions_update" ON qfk_poster_versions;
CREATE POLICY "qfk_poster_versions_update" ON qfk_poster_versions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "qfk_poster_versions_delete" ON qfk_poster_versions;
CREATE POLICY "qfk_poster_versions_delete" ON qfk_poster_versions FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_qfk_match_players_match ON qfk_match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_qfk_match_players_team ON qfk_match_players(match_team_id);
CREATE INDEX IF NOT EXISTS idx_qfk_match_teams_match ON qfk_match_teams(match_id);
CREATE INDEX IF NOT EXISTS idx_qfk_formation_positions_formation ON qfk_formation_positions(formation_id);
CREATE INDEX IF NOT EXISTS idx_qfk_poster_versions_match ON qfk_poster_versions(match_id);
