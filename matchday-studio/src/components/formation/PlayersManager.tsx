import { useState } from 'react';
import type { FormEvent } from 'react';
import type { QfkPlayer } from '@/lib/formation-types';

interface Props {
  compact?: boolean;
  players: QfkPlayer[];
  onAdd: (name: string, jerseyNumber: number | null) => Promise<void>;
  onSelect?: (player: QfkPlayer) => void;
  selectedIds?: string[];
}

export function PlayersManager({ players, onAdd, onSelect, selectedIds = [], compact = false }: Props) {
  const [name, setName] = useState('');
  const [jersey, setJersey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await onAdd(name.trim(), jersey === '' ? null : Number(jersey));
      setName(''); setJersey('');
      setMessage(onSelect ? 'Player created and added to the lineup.' : 'Player added. Open a match’s Build screen to assign them.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save player. Please try again.');
    } finally { setSaving(false); }
  };
  const fieldClass = 'mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white';
  return (
    <section className={compact ? "min-w-0" : "mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-5"}>
      <h2 className={compact ? "sr-only" : "text-lg font-bold"}>{onSelect ? 'Add Players to Lineup' : 'Players'}</h2>
      {!compact && <p className="mt-1 text-sm text-neutral-400">Create a player once and use them across your matches.</p>}
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className={`${compact ? "min-w-0 w-full" : "min-w-48 flex-1"} text-xs font-semibold text-neutral-300`}>Player name
          <input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className={fieldClass} placeholder="Enter player name" />
        </label>
        <label className={`${compact ? "w-full" : "w-36"} text-xs font-semibold text-neutral-300`}>Jersey number (optional)
          <input type="number" min={0} max={999} step={1} value={jersey} onChange={e => setJersey(e.target.value)} className={fieldClass} placeholder="e.g. 10" />
        </label>
        <button disabled={saving} className="min-h-11 rounded-lg bg-amber-500 px-2 py-2 text-xs font-bold text-neutral-950 disabled:opacity-50">{saving ? 'Saving…' : '+ Add Player'}</button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-green-400">{message}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {players.map(player => {
          const selected = selectedIds.includes(player.id);
          return <div key={player.id} className="flex items-center justify-between gap-3 rounded-lg bg-neutral-800 px-3 py-2">
            <span className="text-sm">{player.name}{player.jersey_number !== null && <span className="ml-2 text-neutral-400">#{player.jersey_number}</span>}</span>
            {onSelect && <button disabled={selected} onClick={() => onSelect(player)} className="rounded bg-neutral-700 px-2 py-1 text-xs font-semibold disabled:text-neutral-500">{selected ? 'In lineup' : 'Add to lineup'}</button>}
          </div>;
        })}
      </div>
      {!compact && players.length === 0 && <p className="mt-4 text-sm text-neutral-500">No players yet. Add your first player above.</p>}
    </section>
  );
}
