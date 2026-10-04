import { useRef, useState } from 'react';
import type { ReactNode, PointerEvent } from 'react';
import type { SavedFormation, Side, PlayerStatus, QfkPlayer } from '@/lib/formation-types';
import { POSITION_OPTIONS } from '@/lib/formation-types';
import { placePlayer } from '@/lib/lineup-placement';

export interface BuilderPlayer {
  id: string; player_id: string; name: string; jersey_number: number;
  team: Side | null; position: string; slot_index: number; status: PlayerStatus;
}
interface FormationBuilderProps {
  players: BuilderPlayer[];
  onChange: (players: BuilderPlayer[]) => void;
  roster?: QfkPlayer[];
  playerForm?: ReactNode;
  teamAFormation: SavedFormation | null; teamBFormation: SavedFormation | null;
  teamAName: string; teamBName: string;
  teamAPrimary: string; teamASecondary: string; teamAText: string; teamAGK: string;
  teamBPrimary: string; teamBSecondary: string; teamBText: string; teamBGK: string;
}

export function FormationBuilder(props: FormationBuilderProps) {
  const { players, onChange } = props;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileTeam, setMobileTeam] = useState<Side>('A');
  const [message, setMessage] = useState('');
  const gesture = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const allPlayers = [...players, ...(props.roster ?? []).filter(p => !players.some(bp => bp.player_id === p.id)).map(p => ({
    id: `temp-${p.id}`, player_id: p.id, name: p.name, jersey_number: p.jersey_number ?? 0,
    team: null, position: 'GK', slot_index: 0, status: 'unassigned' as const,
  }))];
  const selected = allPlayers.find(p => p.id === selectedId);
  const slots = { A: props.teamAFormation?.positions ?? [], B: props.teamBFormation?.positions ?? [] };
  const name = (team: Side) => team === 'A' ? props.teamAName : props.teamBName;
  const select = (id: string) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    setSelectedId(current => current === id ? null : id);
    setMessage('');
  };
  const place = (id: string, team: Side | null, slot?: number) => {
    const source = allPlayers.find(p => p.id === id);
    if (!source) return;
    const current = players.some(p => p.id === id) ? players : [...players, source];
    const result = placePlayer(current, id, team, slot, slots);
    if (result !== current || current !== players) onChange(result);
    setSelectedId(null);
    setMessage(`${source.name} ${team ? slot === undefined ? `added to ${name(team)} substitutes` : `placed in ${name(team)} — ${slots[team][slot]?.label ?? ''}` : 'moved to available players'}.`);
  };
  const start = (event: PointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0) return;
    gesture.current = { id, x: event.clientX, y: event.clientY, moved: false };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || Math.hypot(event.clientX - g.x, event.clientY - g.y) < 8) return;
    g.moved = true;
    setSelectedId(g.id);
  };
  const finish = (event: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.moved) return;
    suppressClick.current = true;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-lineup-target]');
    if (!target) { setMessage('Tap a position to place the selected player.'); return; }
    const team = target.dataset.team as Side;
    place(g.id, target.dataset.lineupTarget === 'unassigned' ? null : team,
      target.dataset.lineupTarget === 'slot' ? Number(target.dataset.slot) : undefined);
  };
  const sourceProps = (id: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => start(e, id),
    onPointerMove: move, onPointerUp: finish,
    onPointerCancel: () => { gesture.current = null; suppressClick.current = false; },
  });
  const destinationClick = (team: Side, slot: number, occupant?: BuilderPlayer) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (selectedId && selectedId !== occupant?.id) place(selectedId, team, slot);
    else if (occupant) select(occupant.id);
  };
  const updateSelected = (field: 'name' | 'jersey_number' | 'position', value: string | number) => {
    if (!selected) return;
    const current = players.some(p => p.id === selected.id) ? players : [...players, selected];
    onChange(current.map(p => p.id === selected.id ? { ...p, [field]: value } : p));
  };
  return <div className="space-y-3">
    <p className="text-xs text-neutral-400">Drag a player onto the pitch, or tap a name then a position. Tap another player to swap. Switch teams to move between pitches.</p>
    <div role="status" className="rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-sm">
      {selected ? <><strong>{selected.name}</strong> selected — tap a position or drag onto the pitch. <button className="ml-2 underline" onClick={() => setSelectedId(null)}>Cancel selection</button></> : message || 'Select a player from the list or pitch.'}
    </div>
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="min-w-0 self-start sticky top-2 rounded-lg border border-neutral-800 bg-neutral-900 p-2">
        <h3 className="mb-2 text-xs font-bold">Players ({allPlayers.length})</h3>
        <div className="max-h-[55vh] space-y-1 overflow-y-auto">
          {allPlayers.map(p => <button type="button" key={p.id} {...sourceProps(p.id)} onClick={() => select(p.id)}
            aria-label={`Select ${p.name}`} aria-pressed={selectedId === p.id}
            className={`w-full min-h-11 touch-pan-y select-none rounded-md border p-2 text-left text-xs ${selectedId === p.id ? 'border-amber-500 bg-amber-500/20' : 'border-neutral-700 bg-neutral-800'}`}>
            <span className="block break-words font-semibold">{p.name}</span>
            <span className="block text-[10px] text-neutral-400">#{p.jersey_number} · {p.team ? `${name(p.team)}${p.status === 'substitute' ? ' sub' : ''}` : 'Available'}</span>
          </button>)}
          {!allPlayers.length && <p className="text-xs text-neutral-400">No players yet. Add one below.</p>}
        </div>
        <details className="mt-2 text-xs"><summary className="cursor-pointer py-2 font-semibold">+ New player</summary>{props.playerForm}</details>
      </aside>
      <div className="min-w-0 space-y-2">
        <div className="flex gap-1 md:hidden" role="group" aria-label="Pitch team">
          {(['A','B'] as const).map(team => <button key={team} onClick={() => setMobileTeam(team)} aria-pressed={mobileTeam === team}
            className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 text-xs font-semibold ${mobileTeam === team ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>{name(team)}</button>)}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {(['A','B'] as const).map(team => <div key={team} className={`${mobileTeam !== team ? 'hidden md:block' : ''} min-w-0`}>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 sm:p-2">
              <div className="mb-2 flex flex-wrap justify-between gap-1 text-xs"><strong>{name(team)}</strong><span>{players.filter(p=>p.team===team && p.status==='starter').length}/{slots[team].length} filled</span></div>
              <div className="qfk-pitch relative w-full overflow-hidden rounded-lg bg-green-700" style={{aspectRatio:'3/4'}}>
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 140" preserveAspectRatio="none">
                  <rect width="100" height="140" fill="#237039" />
                  <g stroke="#F4EBDD" strokeWidth="0.4" fill="none" opacity="0.6"><rect x="3" y="3" width="94" height="134"/><line x1="3" y1="70" x2="97" y2="70"/><circle cx="50" cy="70" r="10"/><rect x="25" y="3" width="50" height="18"/><rect x="25" y="119" width="50" height="18"/></g>
                </svg>
                {slots[team].map((slot,i) => {
                  const p=players.find(p=>p.team===team && p.status==='starter' && p.slot_index===i);
                  return <button type="button" key={i} data-lineup-target="slot" data-team={team} data-slot={i}
                    {...(p ? sourceProps(p.id) : {})} onClick={()=>destinationClick(team,i,p)}
                    aria-label={`${name(team)} ${slot.label}${p ? `: ${p.name}` : ': empty'}`} aria-pressed={!!p && selectedId===p.id}
                    className="absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center justify-center rounded-lg"
                    style={{left:`${slot.x}%`,top:`${slot.y}%`,outline:p && selectedId===p.id ? '2px solid #fbbf24' : undefined}}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shadow-lg sm:h-8 sm:w-8"
                      style={{backgroundColor:slot.position_code==='GK' ? (team==='A'?props.teamAGK:props.teamBGK) : (team==='A'?props.teamAPrimary:props.teamBPrimary),color:team==='A'?props.teamAText:props.teamBText,border:`2px solid ${team==='A'?props.teamASecondary:props.teamBSecondary}`}}>{p?.jersey_number ?? slot.label}</span>
                    <span className="max-w-[54px] truncate text-[9px] font-semibold text-white" style={{textShadow:'0 1px 2px #000'}}>{p?.name ?? slot.label}</span>
                  </button>;
                })}
              </div>
              {!slots[team].length && <p className="p-2 text-xs">Choose a formation in Edit Match first.</p>}
            </div>
          </div>)}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(['A','B'] as const).map(team => <button type="button" key={team} data-lineup-target="sub" data-team={team}
            onClick={()=>selectedId && place(selectedId,team)} className="min-h-11 rounded-lg border border-dashed border-neutral-600 bg-neutral-900 p-2 text-left text-xs">
            <strong>{name(team)} substitutes</strong><span className="block">{players.filter(p=>p.team===team && p.status==='substitute').map(p=>p.name).join(', ') || 'Tap or drop to add'}</span>
          </button>)}
        </div>
        <button type="button" data-lineup-target="unassigned" onClick={()=>selectedId && place(selectedId,null)} className="min-h-11 w-full rounded-lg border border-dashed border-neutral-600 p-2 text-xs">Tap or drop to unassign</button>
      </div>
    </div>
    {selected && <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-3"><summary className="cursor-pointer text-sm font-semibold">Edit {selected.name}</summary><div className="mt-3 flex flex-wrap gap-3">
      <label className="text-xs">Name<input className="mt-1 block w-40 rounded border p-2" value={selected.name} onChange={e=>updateSelected('name',e.target.value)}/></label>
      <label className="text-xs">Jersey number<input className="mt-1 block w-24 rounded border p-2" type="number" min={0} value={selected.jersey_number} onChange={e=>updateSelected('jersey_number',Number(e.target.value))}/></label>
      <label className="text-xs">Position<select className="mt-1 block rounded border p-2" value={selected.position} onChange={e=>updateSelected('position',e.target.value)}>{POSITION_OPTIONS.map(p=><option key={p}>{p}</option>)}</select></label>
    </div></details>}
  </div>;
}

