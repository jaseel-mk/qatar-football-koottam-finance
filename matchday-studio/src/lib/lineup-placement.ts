import type { BuilderPlayer } from '@/components/formation/FormationBuilder';
import type { SavedFormation, Side } from './formation-types';

export function placePlayer(players: BuilderPlayer[], id: string, team: Side | null, slot: number | undefined,
  slots: Record<Side, NonNullable<SavedFormation['positions']>>): BuilderPlayer[] {
  const source = players.find(p => p.id === id);
  if (!source || (team && slot !== undefined && !slots[team][slot])) return players;
  const status = team === null ? 'unassigned' : slot === undefined ? 'substitute' : 'starter';
  if (source.team === team && source.status === status && (slot === undefined || source.slot_index === slot)) return players;
  const occupant = team && slot !== undefined ? players.find(p => p.id !== id && p.team === team && p.status === 'starter' && p.slot_index === slot) : undefined;
  return players.map(p => p.id === id ? {
    ...p, team, status, slot_index: slot ?? 0,
    position: team && slot !== undefined ? slots[team][slot].position_code : p.position,
  } : p.id === occupant?.id ? {
    ...p, team: source.team, status: source.status, slot_index: source.slot_index,
    position: source.position,
  } : p);
}

