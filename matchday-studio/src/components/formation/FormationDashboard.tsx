import type { QfkMatch, MatchTeam, SavedFormation } from '@/lib/formation-types';

export interface MatchWithTeams extends QfkMatch {
  teams: MatchTeam[];
}

interface DashboardProps {
  matches: MatchWithTeams[];
  formations: SavedFormation[];
  onView: (match: MatchWithTeams) => void;
  onEdit: (match: MatchWithTeams) => void;
  onDuplicate: (match: MatchWithTeams) => void;
  onBuilder: (match: MatchWithTeams) => void;
  onPoster: (match: MatchWithTeams) => void;
  onDelete: (match: MatchWithTeams) => void;
  onCreate: () => void;
  onManageFormations: () => void;
  onManagePlayers: () => void;
}

export function FormationDashboard({
  matches, formations, onView, onEdit, onDuplicate, onBuilder, onPoster, onDelete, onCreate, onManageFormations, onManagePlayers,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Formation Setup</h2>
          <p className="text-sm text-neutral-400">Create and manage QFK matches, lineups, and posters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onManagePlayers} className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-800">Players</button>
          <button onClick={onManageFormations}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-800">
            Saved Formations
          </button>
          <button onClick={onCreate}
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-neutral-950 hover:bg-amber-400">
            + Create New Match
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
          <p className="text-neutral-500">No matches yet. Create your first match to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-3 py-3 text-left">Match #</th>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Time</th>
                <th className="px-3 py-3 text-left">Venue</th>
                <th className="px-3 py-3 text-left">Team A</th>
                <th className="px-3 py-3 text-left">Team B</th>
                <th className="px-3 py-3 text-left">Form A</th>
                <th className="px-3 py-3 text-left">Form B</th>
                <th className="px-3 py-3 text-left">Theme</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {matches.map((m) => {
                const teamA = m.teams.find((t) => t.side === 'A');
                const teamB = m.teams.find((t) => t.side === 'B');
                const formA = formations.find((f) => f.id === teamA?.formation_id);
                const formB = formations.find((f) => f.id === teamB?.formation_id);
                return (
                  <tr key={m.id} className="bg-neutral-950 hover:bg-neutral-900/50">
                    <td className="px-3 py-3 font-bold text-amber-500">#{m.match_number}</td>
                    <td className="px-3 py-3 text-neutral-300">{m.match_date}</td>
                    <td className="px-3 py-3 text-neutral-300">{m.start_time}</td>
                    <td className="px-3 py-3 text-neutral-300">{m.venue}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: teamA?.primary_color }} />
                        <span className="text-white">{teamA?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: teamB?.primary_color }} />
                        <span className="text-white">{teamB?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutral-400">{formA?.code ?? '—'}</td>
                    <td className="px-3 py-3 text-neutral-400">{formB?.code ?? '—'}</td>
                    <td className="px-3 py-3 text-neutral-400 capitalize">{m.poster_theme}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <ActionBtn label="View" onClick={() => onView(m)} />
                        <ActionBtn label="Edit" onClick={() => onEdit(m)} />
                        <ActionBtn label="Build" onClick={() => onBuilder(m)} />
                        <ActionBtn label="Poster" onClick={() => onPoster(m)} />
                        <ActionBtn label="Dup" onClick={() => onDuplicate(m)} />
                        <ActionBtn label="Del" onClick={() => onDelete(m)} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-amber-900/50 text-amber-300',
    ready: 'bg-blue-900/50 text-blue-300',
    confirmed: 'bg-green-900/50 text-green-300',
    archived: 'bg-neutral-800 text-neutral-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${colors[status] ?? colors.draft}`}>
      {status}
    </span>
  );
}

function ActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
        danger ? 'bg-red-900/40 text-red-300 hover:bg-red-800/60' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
      }`}
    >
      {label}
    </button>
  );
}
