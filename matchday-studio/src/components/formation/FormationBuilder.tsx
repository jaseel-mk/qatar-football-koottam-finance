import { useState, useRef, useCallback, useMemo } from 'react';
import type { SavedFormation, Side, PlayerStatus } from '@/lib/formation-types';
import { POSITION_OPTIONS } from '@/lib/formation-types';

interface BuilderPlayer {
  id: string;
  player_id: string;
  name: string;
  jersey_number: number;
  team: Side | null;
  position: string;
  slot_index: number;
  status: PlayerStatus;
}

interface FormationBuilderProps {
  players: BuilderPlayer[];
  onChange: (players: BuilderPlayer[]) => void;
  teamAFormation: SavedFormation | null;
  teamBFormation: SavedFormation | null;
  teamAName: string;
  teamBName: string;
  teamAPrimary: string;
  teamASecondary: string;
  teamAText: string;
  teamAGK: string;
  teamBPrimary: string;
  teamBSecondary: string;
  teamBText: string;
  teamBGK: string;
}

export type { BuilderPlayer };

export function FormationBuilder(props: FormationBuilderProps) {
  const { players, onChange } = props;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'pitch' | 'subs'>('pitch');

  const unassigned = players.filter((p) => p.team === null || p.status === 'unassigned');
  const teamAStarters = players.filter((p) => p.team === 'A' && p.status === 'starter');
  const teamBStarters = players.filter((p) => p.team === 'B' && p.status === 'starter');
  const teamASubs = players.filter((p) => p.team === 'A' && p.status === 'substitute');
  const teamBSubs = players.filter((p) => p.team === 'B' && p.status === 'substitute');

  const teamASlots = useMemo(() => props.teamAFormation?.positions ?? [], [props.teamAFormation]);
  const teamBSlots = useMemo(() => props.teamBFormation?.positions ?? [], [props.teamBFormation]);

  const filledA = teamAStarters.length;
  const totalA = teamASlots.length;
  const filledB = teamBStarters.length;
  const totalB = teamBSlots.length;

  const handlePlayerDragStart = (id: string) => setDraggingId(id);

  const handleSlotDrop = useCallback((team: Side, slotIndex: number) => {
    if (!draggingId) return;
    const dragged = players.find((p) => p.id === draggingId);
    if (!dragged) return;
    if (dragged.team === team && dragged.status === 'starter' && dragged.slot_index === slotIndex) {
      setDraggingId(null);
      return;
    }

    // Check if destination slot already has a player
    const occupant = players.find(
      (p) => p.team === team && p.status === 'starter' && p.slot_index === slotIndex && p.id !== draggingId,
    );

    if (occupant) {
      // Swap: move occupant to dragged player's old slot
      const newPlayers = players.map((p) => {
        if (p.id === draggingId) {
          return {
            ...p,
            team,
            status: 'starter' as PlayerStatus,
            slot_index: slotIndex,
            position: team === 'A' ? teamASlots[slotIndex]?.position_code ?? 'GK' : teamBSlots[slotIndex]?.position_code ?? 'GK',
          };
        }
        if (p.id === occupant.id) {
          return {
            ...p,
            team: dragged.team,
            status: dragged.status,
            slot_index: dragged.slot_index,
            position: dragged.position,
          };
        }
        return p;
      });
      onChange(newPlayers);
    } else {
      const newPlayers = players.map((p) => {
        if (p.id === draggingId) {
          return {
            ...p,
            team,
            status: 'starter' as PlayerStatus,
            slot_index: slotIndex,
            position: team === 'A' ? teamASlots[slotIndex]?.position_code ?? 'GK' : teamBSlots[slotIndex]?.position_code ?? 'GK',
          };
        }
        return p;
      });
      onChange(newPlayers);
    }
    setDraggingId(null);
  }, [draggingId, players, onChange, teamASlots, teamBSlots]);

  const handleUnassignedDrop = useCallback(() => {
    if (!draggingId) return;
    onChange(players.map((p) =>
      p.id === draggingId ? { ...p, team: null, status: 'unassigned' as PlayerStatus, slot_index: 0 } : p,
    ));
    setDraggingId(null);
  }, [draggingId, players, onChange]);

  const handleSubDrop = useCallback((team: Side) => {
    if (!draggingId) return;
    onChange(players.map((p) =>
      p.id === draggingId ? { ...p, team, status: 'substitute' as PlayerStatus, slot_index: 0 } : p,
    ));
    setDraggingId(null);
  }, [draggingId, players, onChange]);

  const updatePlayer = (id: string, field: keyof BuilderPlayer, value: string | number) => {
    onChange(players.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePlayer = (id: string) => {
    onChange(players.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4" onPointerUp={event => {
      if (!draggingId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-lineup-target]');
      if (!target) return;
      const team = target.dataset.team as Side;
      if (target.dataset.lineupTarget === 'slot') handleSlotDrop(team, Number(target.dataset.slot));
      else if (target.dataset.lineupTarget === 'sub') handleSubDrop(team);
      else handleUnassignedDrop();
    }}>
      {/* Mobile tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-900 p-1 md:hidden">
        {(['players', 'pitch', 'subs'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
              activeTab === tab ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
            }`}>
            {tab === 'subs' ? 'Substitutes' : tab}
          </button>
        ))}
      </div>

      <p className="hidden text-xs text-neutral-400 md:block">Drag a player onto a position on either pitch. Click a player, then a position to assign without dragging.</p>
      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_180px]">
        {/* Players panel */}
        <div className={`${activeTab !== 'players' ? 'hidden md:block' : ''} space-y-2 md:sticky md:top-24 md:self-start`}>
          <div data-lineup-target="unassigned" className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              Available Players ({unassigned.length})
            </h4>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {unassigned.map((p) => (
                <PlayerChip key={p.id} player={p} onDragStart={handlePlayerDragStart}
                  onEdit={() => setEditingPlayerId(editingPlayerId === p.id ? null : p.id)}
                  isEditing={editingPlayerId === p.id}
                  onUpdate={updatePlayer} onRemove={removePlayer}
                />
              ))}
              {unassigned.length === 0 && (
                <p className="py-4 text-center text-xs text-neutral-500">All players assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Pitch */}
        <div className={`${activeTab !== 'pitch' ? 'hidden md:block' : ''} min-w-0`}>
          <div className="grid grid-cols-2 gap-2">
            {/* Team A pitch */}
            <TeamPitch
              team="A"
              name={props.teamAName}
              slots={teamASlots}
              starters={teamAStarters}
              primary={props.teamAPrimary}
              secondary={props.teamASecondary}
              textColor={props.teamAText}
              gkColor={props.teamAGK}
              filled={filledA} total={totalA}
              onSlotDrop={handleSlotDrop}
              draggingId={draggingId}
              onPlayerDragStart={handlePlayerDragStart}
              onEditPlayer={setEditingPlayerId}
              editingPlayerId={editingPlayerId}
              onUpdatePlayer={updatePlayer}
            />
            {/* Team B pitch */}
            <TeamPitch
              team="B"
              name={props.teamBName}
              slots={teamBSlots}
              starters={teamBStarters}
              primary={props.teamBPrimary}
              secondary={props.teamBSecondary}
              textColor={props.teamBText}
              gkColor={props.teamBGK}
              filled={filledB} total={totalB}
              onSlotDrop={handleSlotDrop}
              draggingId={draggingId}
              onPlayerDragStart={handlePlayerDragStart}
              onEditPlayer={setEditingPlayerId}
              editingPlayerId={editingPlayerId}
              onUpdatePlayer={updatePlayer}
            />
          </div>

          {/* Unassigned drop zone */}
          <DropZone
            label="Drop here to unassign"
            onDrop={handleUnassignedDrop}
            isActive={!!draggingId}
          />
        </div>

        {/* Substitutes panel */}
        <div className={`${activeTab !== 'subs' ? 'hidden md:grid' : 'grid'} gap-2 md:col-span-2 md:grid-cols-2 xl:col-span-1 xl:grid-cols-1 xl:self-start`}>
          <SubPanel team="A" name={props.teamAName} subs={teamASubs}
            primary={props.teamAPrimary} textColor={props.teamAText}
            onDrop={() => handleSubDrop('A')} isActive={!!draggingId}
            onDragStart={handlePlayerDragStart}
            onEdit={setEditingPlayerId} editingId={editingPlayerId}
            onUpdate={updatePlayer} onRemove={removePlayer}
          />
          <SubPanel team="B" name={props.teamBName} subs={teamBSubs}
            primary={props.teamBPrimary} textColor={props.teamBText}
            onDrop={() => handleSubDrop('B')} isActive={!!draggingId}
            onDragStart={handlePlayerDragStart}
            onEdit={setEditingPlayerId} editingId={editingPlayerId}
            onUpdate={updatePlayer} onRemove={removePlayer}
          />
        </div>
      </div>
    </div>
  );
}

interface TeamPitchProps {
  team: Side;
  name: string;
  slots: { position_code: string; label: string; x: number; y: number; display_order: number }[];
  starters: BuilderPlayer[];
  primary: string;
  secondary: string;
  textColor: string;
  gkColor: string;
  filled: number;
  total: number;
  onSlotDrop: (team: Side, slotIndex: number) => void;
  draggingId: string | null;
  onPlayerDragStart: (id: string) => void;
  onEditPlayer: (id: string | null) => void;
  editingPlayerId: string | null;
  onUpdatePlayer: (id: string, field: keyof BuilderPlayer, value: string | number) => void;
}

function TeamPitch({
  team, name, slots, starters, primary, secondary, textColor, gkColor,
  filled, total, onSlotDrop, onPlayerDragStart, onEditPlayer, editingPlayerId, onUpdatePlayer,
}: TeamPitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-white">{name}</span>
        <span className={`text-[10px] font-semibold ${filled === total ? 'text-green-400' : 'text-amber-400'}`}>
          {filled}/{total} filled
        </span>
      </div>
      <div
        ref={pitchRef}
        className="qfk-pitch relative w-full overflow-hidden rounded-lg bg-green-700 touch-none select-none"
        style={{ aspectRatio: '3/4' }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 140" preserveAspectRatio="none">
          <defs>
            <pattern id={`builder-mow-${team}`} width="10" height="20" patternUnits="userSpaceOnUse">
              <rect width="10" height="20" fill="#1e6332" />
              <rect x="0" width="5" height="20" fill="#237039" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="140" fill={`url(#builder-mow-${team})`} />
          <g stroke="#F4EBDD" strokeWidth="0.4" fill="none" opacity="0.5">
            <rect x="3" y="3" width="94" height="134" rx="1" />
            <line x1="3" y1="70" x2="97" y2="70" />
            <circle cx="50" cy="70" r="10" />
            <rect x="25" y="3" width="50" height="18" />
            <rect x="36" y="3" width="28" height="7" />
            <rect x="25" y="119" width="50" height="18" />
            <rect x="36" y="130" width="28" height="7" />
          </g>
        </svg>

        {slots.map((slot, i) => {
          const player = starters.find((p) => p.slot_index === i);
          const isGK = slot.position_code === 'GK';
          const bg = isGK ? gkColor : primary;
          const txt = isGK ? '#F4EBDD' : textColor;

          return (
            <div key={i}
              data-lineup-target="slot" data-team={team} data-slot={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.x}%`, top: `${slot.y}%`, touchAction: 'none' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); onSlotDrop(team, i); }}
            >
              <div
                className="flex flex-col items-center cursor-grab active:cursor-grabbing"
                draggable={!!player}
                onDragStart={e => {
                  if (player) { e.dataTransfer.setData('text/plain', player.id); onPlayerDragStart(player.id); }
                }}
                onPointerDown={(e) => {
                  if (player) {
                    e.stopPropagation();
                    e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    onPlayerDragStart(player.id);
                  }
                }}
                onClick={() => player && onEditPlayer(editingPlayerId === player.id ? null : player.id)}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold shadow-lg ring-2"
                  style={{ backgroundColor: bg, color: txt, borderColor: secondary }}
                >
                  {player ? player.jersey_number : slot.label}
                </div>
                {player && (
                  <span className="mt-0.5 max-w-[70px] truncate text-[8px] font-semibold text-white"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    {player.name}
                  </span>
                )}
                {editingPlayerId === player?.id && (
                  <PlayerEditPopover
                    player={player!}
                    onUpdate={(field, val) => onUpdatePlayer(player!.id, field, val)}
                    onClose={() => onEditPlayer(null)}
                  />
                )}
              </div>

              {/* Empty slot drop target */}
              {!player && (
                <div
                  className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ width: 36, height: 36, left: '50%', top: '50%' }}
                  onPointerUp={() => onSlotDrop(team, i)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerEditPopover({
  player,
  onUpdate,
  onClose,
}: {
  player: BuilderPlayer;
  onUpdate: (field: keyof BuilderPlayer, value: string | number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute top-10 z-50 flex flex-col gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate('name', e.target.value)}
        className="w-32 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-white"
        placeholder="Name"
      />
      <input
        type="number"
        value={player.jersey_number}
        onChange={(e) => onUpdate('jersey_number', parseInt(e.target.value) || 0)}
        className="w-32 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-white"
        placeholder="Number"
      />
      <select
        value={player.position}
        onChange={(e) => onUpdate('position', e.target.value)}
        className="w-32 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-white"
      >
        {POSITION_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="flex gap-1">
        <button onClick={onClose}
          className="flex-1 rounded bg-neutral-700 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-neutral-600">
          Done
        </button>
      </div>
    </div>
  );
}

function PlayerChip({
  player, onDragStart, onEdit, isEditing, onUpdate, onRemove,
}: {
  player: BuilderPlayer;
  onDragStart: (id: string) => void;
  onEdit: () => void;
  isEditing: boolean;
  onUpdate: (id: string, field: keyof BuilderPlayer, value: string | number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 cursor-grab active:cursor-grabbing touch-none"
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', player.id); onDragStart(player.id); }}
      onPointerDown={(e) => {
        e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
        onDragStart(player.id);
      }}
      onClick={onEdit}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-neutral-950">
        {player.jersey_number}
      </span>
      <span className="flex-1 truncate text-xs text-white">{player.name}</span>
      {isEditing && (
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          <input type="text" value={player.name}
            onChange={(e) => onUpdate(player.id, 'name', e.target.value)}
            className="w-20 rounded border border-neutral-600 bg-neutral-700 px-1 py-0.5 text-[10px] text-white" />
          <input type="number" value={player.jersey_number}
            onChange={(e) => onUpdate(player.id, 'jersey_number', parseInt(e.target.value) || 0)}
            className="w-20 rounded border border-neutral-600 bg-neutral-700 px-1 py-0.5 text-[10px] text-white" />
          <button onClick={() => onRemove(player.id)}
            className="rounded bg-red-600 px-1 py-0.5 text-[10px] text-white">Remove</button>
        </div>
      )}
    </div>
  );
}

function SubPanel({
  team, name, subs, primary, textColor, onDrop, isActive,
  onDragStart, onEdit, editingId, onUpdate, onRemove,
}: {
  team: Side;
  name: string;
  subs: BuilderPlayer[];
  primary: string;
  textColor: string;
  onDrop: () => void;
  isActive: boolean;
  onDragStart: (id: string) => void;
  onEdit: (id: string | null) => void;
  editingId: string | null;
  onUpdate: (id: string, field: keyof BuilderPlayer, value: string | number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">
        {name} Subs ({subs.length})
      </h4>
      <DropZone label="Drop to make sub" onDrop={onDrop} isActive={isActive} compact team={team} />
      <div className="mt-2 space-y-1">
        {subs.map((p) => (
          <div key={p.id}
            className="flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 cursor-grab active:cursor-grabbing touch-none"
            draggable
            onDragStart={e => { e.dataTransfer.setData('text/plain', p.id); onDragStart(p.id); }}
            onPointerDown={(e) => {
              e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
              onDragStart(p.id);
            }}
            onClick={() => onEdit(editingId === p.id ? null : p.id)}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: primary, color: textColor }}>
              {p.jersey_number}
            </span>
            <span className="flex-1 truncate text-xs text-white">{p.name}</span>
            {editingId === p.id && (
              <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                <input type="text" value={p.name}
                  onChange={(e) => onUpdate(p.id, 'name', e.target.value)}
                  className="w-20 rounded border border-neutral-600 bg-neutral-700 px-1 py-0.5 text-[10px] text-white" />
                <input type="number" value={p.jersey_number}
                  onChange={(e) => onUpdate(p.id, 'jersey_number', parseInt(e.target.value) || 0)}
                  className="w-20 rounded border border-neutral-600 bg-neutral-700 px-1 py-0.5 text-[10px] text-white" />
                <button onClick={() => onRemove(p.id)}
                  className="rounded bg-red-600 px-1 py-0.5 text-[10px] text-white">Remove</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DropZone({ label, onDrop, isActive, compact, team }: { label: string; onDrop: () => void; isActive: boolean; compact?: boolean; team?: Side }) {
  return (
    <div
      data-lineup-target={team ? 'sub' : 'unassigned'} data-team={team}
      onPointerUp={onDrop}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      className={`rounded-lg border-2 border-dashed text-center transition-colors ${
        compact ? 'border-neutral-700 py-1.5 text-[10px]' : 'border-neutral-600 py-3 text-xs'
      } ${isActive ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'text-neutral-500'}`}
    >
      {label}
    </div>
  );
}

