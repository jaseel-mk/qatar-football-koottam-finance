export type Side = 'A' | 'B';
export type PlayerStatus = 'starter' | 'substitute' | 'unassigned';
export type MatchStatus = 'draft' | 'ready' | 'confirmed' | 'archived';

export interface QfkPlayer {
  id: string;
  name: string;
  jersey_number: number | null;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormationPosition {
  id: string;
  formation_id: string;
  position_code: string;
  label: string;
  x: number;
  y: number;
  display_order: number;
}

export interface SavedFormation {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  positions?: FormationPosition[];
}

export interface QfkMatch {
  id: string;
  match_number: number;
  match_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  title: string;
  description: string | null;
  poster_theme: string;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

export interface MatchTeam {
  id: string;
  match_id: string;
  side: Side;
  name: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  goalkeeper_color: string;
  formation_id: string | null;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  match_team_id: string | null;
  player_id: string;
  name_snapshot: string;
  jersey_number: number;
  position: string;
  position_slot_index: number;
  status: PlayerStatus;
  display_order: number;
}

export interface PosterVersion {
  id: string;
  match_id: string;
  theme: string;
  file_path: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FormationDraftPosition {
  id: string;
  position_code: string;
  label: string;
  x: number;
  y: number;
  display_order: number;
}

export const POSITION_OPTIONS = [
  'GK', 'LB', 'CB', 'RB', 'LM', 'CM', 'RM', 'LW', 'RW', 'ST', 'CAM',
];

export const POSTER_THEMES = [
  { id: 'auto', name: 'Auto Rotate' },
  { id: 'stadium', name: 'QFK Stadium' },
  { id: 'matchday', name: 'Matchday' },
  { id: 'split', name: 'Split Pitch' },
  { id: 'premium', name: 'QFK Premium' },
  { id: 'community', name: 'Football Community' },
  { id: 'dynamic', name: 'Dynamic Sports' },
] as const;

export type PosterThemeId = typeof POSTER_THEMES[number]['id'];

export function resolveAutoTheme(matchNumber: number): string {
  const themes = ['stadium', 'matchday', 'split', 'premium', 'community', 'dynamic'];
  return themes[(matchNumber - 1) % themes.length];
}
