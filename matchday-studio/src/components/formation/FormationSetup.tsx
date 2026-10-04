import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { QfkPlayer, SavedFormation, MatchTeam, MatchPlayer } from '@/lib/formation-types';
import type { FormationDraftPosition } from '@/lib/formation-types';
import { FormationDashboard } from '@/components/formation/FormationDashboard';
import type { MatchWithTeams } from '@/components/formation/FormationDashboard';
import { MatchForm } from '@/components/formation/MatchForm';
import type { MatchFormData } from '@/components/formation/MatchForm';
import { FormationsManager } from '@/components/formation/FormationsManager';
import { FormationBuilder } from '@/components/formation/FormationBuilder';
import type { BuilderPlayer } from '@/components/formation/FormationBuilder';
import { PosterPreview } from '@/components/formation/PosterPreview';
import type { PosterData } from '@/components/formation/PosterSVG';
import { PlayersManager } from '@/components/formation/PlayersManager';

type View = 'dashboard' | 'create' | 'edit' | 'builder' | 'poster' | 'formations' | 'players';

export function FormationSetup() {
  const [view, setView] = useState<View>('dashboard');
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [formations, setFormations] = useState<SavedFormation[]>([]);
  const [players, setPlayers] = useState<QfkPlayer[]>([]);
  const [editingMatch, setEditingMatch] = useState<MatchWithTeams | null>(null);
  const [builderPlayers, setBuilderPlayers] = useState<BuilderPlayer[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [currentTeams, setCurrentTeams] = useState<MatchTeam[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load all data
  const loadFormations = useCallback(async () => {
    const { data, error } = await supabase
      .from('qfk_saved_formations')
      .select('*, positions:qfk_formation_positions(*)')
      .order('created_at');
    if (error) { setLoadError(error.message); return; }
    if (data) setFormations(data as SavedFormation[]);
  }, []);

  const loadMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('qfk_matches')
      .select('*, teams:qfk_match_teams(*)')
      .order('match_number', { ascending: false });
    if (error) { setLoadError(error.message); return; }
    if (data) setMatches(data as MatchWithTeams[]);
  }, []);

  const loadPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from('qfk_players')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) { setLoadError(error.message); return; }
    if (data) setPlayers(data as QfkPlayer[]);
  }, []);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);
    (async () => {
      await Promise.allSettled([loadFormations(), loadMatches(), loadPlayers()]);
      clearTimeout(timeout);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; clearTimeout(timeout); };
  }, [loadFormations, loadMatches, loadPlayers]);

  // === Match CRUD ===

  const handleCreateMatch = async (formData: MatchFormData) => {
    const { data: matchData } = await supabase
      .from('qfk_matches')
      .insert({
        match_number: formData.match_number,
        match_date: formData.match_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        venue: formData.venue,
        title: formData.title,
        description: formData.description || null,
        poster_theme: formData.poster_theme,
        status: formData.status,
      })
      .select()
      .single();

    if (!matchData) return;

    const teamsToInsert = [
      {
        match_id: matchData.id,
        side: 'A',
        name: formData.team_a_name,
        primary_color: formData.team_a_primary,
        secondary_color: formData.team_a_secondary,
        text_color: formData.team_a_text,
        goalkeeper_color: formData.team_a_gk,
        formation_id: formData.team_a_formation_id || null,
      },
      {
        match_id: matchData.id,
        side: 'B',
        name: formData.team_b_name,
        primary_color: formData.team_b_primary,
        secondary_color: formData.team_b_secondary,
        text_color: formData.team_b_text,
        goalkeeper_color: formData.team_b_gk,
        formation_id: formData.team_b_formation_id || null,
      },
    ];

    await supabase.from('qfk_match_teams').insert(teamsToInsert);
    await loadMatches();
    setView('dashboard');
  };

  const handleEditMatch = async (formData: MatchFormData) => {
    if (!editingMatch) return;
    await supabase
      .from('qfk_matches')
      .update({
        match_number: formData.match_number,
        match_date: formData.match_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        venue: formData.venue,
        title: formData.title,
        description: formData.description || null,
        poster_theme: formData.poster_theme,
        status: formData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingMatch.id);

    const teamA = editingMatch.teams.find((t) => t.side === 'A');
    const teamB = editingMatch.teams.find((t) => t.side === 'B');

    if (teamA) {
      await supabase
        .from('qfk_match_teams')
        .update({
          name: formData.team_a_name,
          primary_color: formData.team_a_primary,
          secondary_color: formData.team_a_secondary,
          text_color: formData.team_a_text,
          goalkeeper_color: formData.team_a_gk,
          formation_id: formData.team_a_formation_id || null,
        })
        .eq('id', teamA.id);
    }

    if (teamB) {
      await supabase
        .from('qfk_match_teams')
        .update({
          name: formData.team_b_name,
          primary_color: formData.team_b_primary,
          secondary_color: formData.team_b_secondary,
          text_color: formData.team_b_text,
          goalkeeper_color: formData.team_b_gk,
          formation_id: formData.team_b_formation_id || null,
        })
        .eq('id', teamB.id);
    }

    await loadMatches();
    setView('dashboard');
    setEditingMatch(null);
  };

  const handleDuplicate = async (match: MatchWithTeams) => {
    const maxNum = Math.max(...matches.map((m) => m.match_number), 0);
    const { data: newMatch } = await supabase
      .from('qfk_matches')
      .insert({
        match_number: maxNum + 1,
        match_date: match.match_date,
        start_time: match.start_time,
        end_time: match.end_time,
        venue: match.venue,
        title: `${match.title} (Copy)`,
        description: match.description,
        poster_theme: match.poster_theme,
        status: 'draft',
      })
      .select()
      .single();

    if (!newMatch) return;

    const teams = match.teams.map((t) => ({
      match_id: newMatch.id,
      side: t.side,
      name: t.name,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      text_color: t.text_color,
      goalkeeper_color: t.goalkeeper_color,
      formation_id: t.formation_id,
    }));
    await supabase.from('qfk_match_teams').insert(teams);
    await loadMatches();
  };

  const handleDelete = async (match: MatchWithTeams) => {
    if (!confirm(`Delete match #${match.match_number}? This cannot be undone.`)) return;
    await supabase.from('qfk_matches').delete().eq('id', match.id);
    await loadMatches();
  };

  // === Formation Builder ===

  const openBuilder = async (match: MatchWithTeams) => {
    setCurrentMatchId(match.id);
    setCurrentTeams(match.teams);

    // Load match players
    const { data: matchPlayers } = await supabase
      .from('qfk_match_players')
      .select('*')
      .eq('match_id', match.id);

    if (matchPlayers && matchPlayers.length > 0) {
      const builderList: BuilderPlayer[] = matchPlayers.map((mp: MatchPlayer) => ({
        id: mp.id,
        player_id: mp.player_id,
        name: mp.name_snapshot,
        jersey_number: mp.jersey_number,
        team: mp.match_team_id
          ? match.teams.find((t) => t.id === mp.match_team_id)?.side ?? null
          : null,
        position: mp.position,
        slot_index: mp.position_slot_index,
        status: mp.status,
      }));
      setBuilderPlayers(builderList);
    } else {
      // No lineup yet — start with all players unassigned
      const allPlayers = await supabase.from('qfk_players').select('*').eq('is_active', true).order('name');
      if (allPlayers.data) {
        const builderList: BuilderPlayer[] = allPlayers.data.map((p: QfkPlayer, i: number) => ({
          id: `temp-${p.id}`,
          player_id: p.id,
          name: p.name,
          jersey_number: p.jersey_number ?? i + 1,
          team: null,
          position: 'GK',
          slot_index: 0,
          status: 'unassigned' as const,
        }));
        setBuilderPlayers(builderList);
      }
    }

    setHasUnsavedChanges(false);
    setView('builder');
  };

  const handleBuilderChange = (newPlayers: BuilderPlayer[]) => {
    setBuilderPlayers(newPlayers);
    setHasUnsavedChanges(true);
  };

  const addPlayerToLineup = (player: QfkPlayer) => {
    setBuilderPlayers(current => current.some(p => p.player_id === player.id) ? current : [...current, {
      id: `temp-${player.id}`, player_id: player.id, name: player.name,
      jersey_number: player.jersey_number ?? 0, team: null, position: 'GK', slot_index: 0, status: 'unassigned',
    }]);
    setHasUnsavedChanges(true);
  };

  const handleAddPlayer = async (name: string, jerseyNumber: number | null) => {
    const { data, error } = await supabase.from('qfk_players')
      .insert({ name, jersey_number: jerseyNumber, is_active: true }).select().single();
    if (error) throw new Error(error.message);
    const player = data as QfkPlayer;
    setPlayers(current => [...current, player].sort((a, b) => a.name.localeCompare(b.name)));
    if (view === 'builder') addPlayerToLineup(player);
  };

  const handleSaveFormation = async () => {
    if (!currentMatchId || !currentTeams.length) return;

    // Delete existing match players
    await supabase.from('qfk_match_players').delete().eq('match_id', currentMatchId);

    // Insert all current builder players
    const inserts = builderPlayers.map((bp) => {
      const team = currentTeams.find((t) => t.side === bp.team);
      return {
        match_id: currentMatchId,
        match_team_id: team?.id ?? null,
        player_id: bp.player_id,
        name_snapshot: bp.name,
        jersey_number: bp.jersey_number,
        position: bp.position,
        position_slot_index: bp.slot_index,
        status: bp.status,
        display_order: 0,
      };
    });

    if (inserts.length > 0) {
      await supabase.from('qfk_match_players').insert(inserts);
    }

    setHasUnsavedChanges(false);
    setSaveMsg('Formation saved successfully');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // === Poster ===

  const openPoster = async (match: MatchWithTeams) => {
    setCurrentMatchId(match.id);
    setCurrentTeams(match.teams);

    const { data: matchPlayers } = await supabase
      .from('qfk_match_players')
      .select('*')
      .eq('match_id', match.id);


    let builderList: BuilderPlayer[] = [];
    if (matchPlayers && matchPlayers.length > 0) {
      builderList = matchPlayers.map((mp: MatchPlayer) => ({
        id: mp.id,
        player_id: mp.player_id,
        name: mp.name_snapshot,
        jersey_number: mp.jersey_number,
        team: mp.match_team_id
          ? match.teams.find((t) => t.id === mp.match_team_id)?.side ?? null
          : null,
        position: mp.position,
        slot_index: mp.position_slot_index,
        status: mp.status,
      }));
    }
    setBuilderPlayers(builderList);
    setView('poster');
  };

  // === Formations Manager ===

  const handleSaveFormationTemplate = async (name: string, code: string, positions: FormationDraftPosition[]) => {
    const { data: formation } = await supabase
      .from('qfk_saved_formations')
      .insert({ name, code, is_active: true })
      .select()
      .single();

    if (!formation) return;

    if (positions.length > 0) {
      const posInserts = positions.map((p, i) => ({
        formation_id: formation.id,
        position_code: p.position_code,
        label: p.label,
        x: p.x,
        y: p.y,
        display_order: i,
      }));
      await supabase.from('qfk_formation_positions').insert(posInserts);
    }

    await loadFormations();
  };

  const handleDeleteFormation = async (id: string) => {
    if (!confirm('Delete this formation?')) return;
    await supabase.from('qfk_saved_formations').delete().eq('id', id);
    await loadFormations();
  };

  // === Poster data construction ===

  const buildPosterData = (): PosterData => {
    const match = matches.find((m) => m.id === currentMatchId);
    const teamA = currentTeams.find((t) => t.side === 'A');
    const teamB = currentTeams.find((t) => t.side === 'B');
    const formA = formations.find((f) => f.id === teamA?.formation_id) ?? null;
    const formB = formations.find((f) => f.id === teamB?.formation_id) ?? null;

    return {
      matchNumber: match?.match_number ?? 0,
      matchTitle: match?.title ?? '',
      matchDate: match?.match_date ?? '',
      startTime: match?.start_time ?? '',
      endTime: match?.end_time ?? '',
      venue: match?.venue ?? '',
      description: match?.description ?? null,
      teamAName: teamA?.name ?? 'Team A',
      teamBName: teamB?.name ?? 'Team B',
      teamAPrimary: teamA?.primary_color ?? '#1746D1',
      teamASecondary: teamA?.secondary_color ?? '#F7F5EE',
      teamAText: teamA?.text_color ?? '#FFFFFF',
      teamAGK: teamA?.goalkeeper_color ?? '#141820',
      teamBPrimary: teamB?.primary_color ?? '#F7F5EE',
      teamBSecondary: teamB?.secondary_color ?? '#1746D1',
      teamBText: teamB?.text_color ?? '#141820',
      teamBGK: teamB?.goalkeeper_color ?? '#141820',
      teamAFormation: formA,
      teamBFormation: formB,
      players: builderPlayers,
    };
  };

  const handleSavePosterVersion = async (theme: string) => {
    if (!currentMatchId) return;
    await supabase.from('qfk_poster_versions').insert({
      match_id: currentMatchId,
      theme,
      is_active: true,
    });
    // Deactivate previous versions
    await supabase
      .from('qfk_poster_versions')
      .update({ is_active: false })
      .eq('match_id', currentMatchId)
      .neq('theme', theme);
  };

  const handleChangeTheme = async (theme: string) => {
    if (!currentMatchId) return;
    await supabase
      .from('qfk_matches')
      .update({ poster_theme: theme, updated_at: new Date().toISOString() })
      .eq('id', currentMatchId);
    await loadMatches();
  };

  // === Render ===

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-500" />
            <p className="text-sm text-neutral-400">Loading matches and formations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-6">
          <h2 className="mb-2 text-sm font-bold text-red-400">Failed to load data</h2>
          <p className="text-xs text-neutral-400">{loadError}</p>
          <button onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <FormationDashboard
          matches={matches}
          formations={formations}
          onView={(m) => openBuilder(m)}
          onEdit={(m) => { setEditingMatch(m); setView('edit'); }}
          onDuplicate={handleDuplicate}
          onBuilder={openBuilder}
          onPoster={openPoster}
          onDelete={handleDelete}
          onCreate={() => setView('create')}
          onManageFormations={() => setView('formations')}
          onManagePlayers={() => setView('players')}
        />
      </div>
    );
  }

  if (view === 'players') {
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <BackBar onBack={() => setView('dashboard')} title="Manage Players" />
      <PlayersManager players={players} onAdd={handleAddPlayer} />
    </div>;
  }

  if (view === 'create' || view === 'edit') {
    const initial = view === 'edit' && editingMatch ? {
      match_number: editingMatch.match_number,
      match_date: editingMatch.match_date,
      start_time: editingMatch.start_time,
      end_time: editingMatch.end_time,
      venue: editingMatch.venue,
      title: editingMatch.title,
      description: editingMatch.description ?? '',
      poster_theme: editingMatch.poster_theme,
      status: editingMatch.status,
      team_a_name: editingMatch.teams.find((t) => t.side === 'A')?.name,
      team_a_primary: editingMatch.teams.find((t) => t.side === 'A')?.primary_color,
      team_a_secondary: editingMatch.teams.find((t) => t.side === 'A')?.secondary_color,
      team_a_text: editingMatch.teams.find((t) => t.side === 'A')?.text_color,
      team_a_gk: editingMatch.teams.find((t) => t.side === 'A')?.goalkeeper_color,
      team_a_formation_id: editingMatch.teams.find((t) => t.side === 'A')?.formation_id ?? '',
      team_b_name: editingMatch.teams.find((t) => t.side === 'B')?.name,
      team_b_primary: editingMatch.teams.find((t) => t.side === 'B')?.primary_color,
      team_b_secondary: editingMatch.teams.find((t) => t.side === 'B')?.secondary_color,
      team_b_text: editingMatch.teams.find((t) => t.side === 'B')?.text_color,
      team_b_gk: editingMatch.teams.find((t) => t.side === 'B')?.goalkeeper_color,
      team_b_formation_id: editingMatch.teams.find((t) => t.side === 'B')?.formation_id ?? '',
    } : { match_number: Math.max(0, ...matches.map(match => match.match_number)) + 1 };

    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <BackBar onBack={() => { setView('dashboard'); setEditingMatch(null); }} title={view === 'create' ? 'Create New Match' : `Edit Match #${editingMatch?.match_number}`} />
        <MatchForm
          initial={initial}
          formations={formations}
          onSubmit={view === 'create' ? handleCreateMatch : handleEditMatch}
          onCancel={() => { setView('dashboard'); setEditingMatch(null); }}
        />
      </div>
    );
  }

  if (view === 'formations') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <BackBar onBack={() => setView('dashboard')} title="Saved Formations" />
        <FormationsManager
          formations={formations}
          onSave={handleSaveFormationTemplate}
          onDelete={handleDeleteFormation}
          onBack={() => setView('dashboard')}
        />
      </div>
    );
  }

  if (view === 'builder') {
    const match = matches.find((m) => m.id === currentMatchId);
    const teamA = currentTeams.find((t) => t.side === 'A');
    const teamB = currentTeams.find((t) => t.side === 'B');
    const formA = formations.find((f) => f.id === teamA?.formation_id) ?? null;
    const formB = formations.find((f) => f.id === teamB?.formation_id) ?? null;

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <BackBar onBack={() => setView('dashboard')} title={`Formation Builder — Match #${match?.match_number}`} />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="rounded-lg bg-amber-900/50 px-3 py-1 text-xs font-semibold text-amber-300">
                Unsaved changes
              </span>
            )}
            {saveMsg && (
              <span className="rounded-lg bg-green-900/50 px-3 py-1 text-xs font-semibold text-green-300">
                {saveMsg}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('poster')}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
              Poster Preview
            </button>
            <button onClick={handleSaveFormation}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-500">
              Save Formation
            </button>
          </div>
        </div>
        <PlayersManager players={players} onAdd={handleAddPlayer} onSelect={addPlayerToLineup} selectedIds={builderPlayers.map(p => p.player_id)} />
        <FormationBuilder
          players={builderPlayers}
          onChange={handleBuilderChange}
          teamAFormation={formA}
          teamBFormation={formB}
          teamAName={teamA?.name ?? 'Team A'}
          teamBName={teamB?.name ?? 'Team B'}
          teamAPrimary={teamA?.primary_color ?? '#1746D1'}
          teamASecondary={teamA?.secondary_color ?? '#F7F5EE'}
          teamAText={teamA?.text_color ?? '#FFFFFF'}
          teamAGK={teamA?.goalkeeper_color ?? '#141820'}
          teamBPrimary={teamB?.primary_color ?? '#F7F5EE'}
          teamBSecondary={teamB?.secondary_color ?? '#1746D1'}
          teamBText={teamB?.text_color ?? '#141820'}
          teamBGK={teamB?.goalkeeper_color ?? '#141820'}
        />
      </div>
    );
  }

  if (view === 'poster') {
    const match = matches.find((m) => m.id === currentMatchId);
    const posterData = buildPosterData();
    const themeId = match?.poster_theme ?? 'auto';

    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <BackBar onBack={() => setView('dashboard')} title={`Poster Preview — Match #${match?.match_number}`} />
        <PosterPreview
          data={posterData}
          themeId={themeId}
          onSaveVersion={handleSavePosterVersion}
          onChangeTheme={handleChangeTheme}
          onEditFormation={() => setView('builder')}
        />
      </div>
    );
  }

  return null;
}

function BackBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <button onClick={onBack}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white">
        <span className="text-lg leading-none">&larr;</span> Back
      </button>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
  );
}
