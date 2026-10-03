import type { Player } from '@/types';

export interface FormationSlot {
  position: string;
  x: number; // 0–100 within half
  y: number; // 0–100 within half
}

const formations: Record<string, FormationSlot[]> = {
  '4-3-3': [
    { position: 'GK', x: 50, y: 92 },
    { position: 'RB', x: 80, y: 70 },
    { position: 'CB', x: 60, y: 73 },
    { position: 'CB', x: 40, y: 73 },
    { position: 'LB', x: 20, y: 70 },
    { position: 'CM', x: 65, y: 48 },
    { position: 'CM', x: 50, y: 52 },
    { position: 'CM', x: 35, y: 48 },
    { position: 'RW', x: 75, y: 22 },
    { position: 'ST', x: 50, y: 18 },
    { position: 'LW', x: 25, y: 22 },
  ],
  '4-4-2': [
    { position: 'GK', x: 50, y: 92 },
    { position: 'RB', x: 80, y: 70 },
    { position: 'CB', x: 60, y: 73 },
    { position: 'CB', x: 40, y: 73 },
    { position: 'LB', x: 20, y: 70 },
    { position: 'RM', x: 80, y: 42 },
    { position: 'CM', x: 60, y: 45 },
    { position: 'CM', x: 40, y: 45 },
    { position: 'LM', x: 20, y: 42 },
    { position: 'ST', x: 60, y: 18 },
    { position: 'ST', x: 40, y: 18 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 92 },
    { position: 'CB', x: 70, y: 73 },
    { position: 'CB', x: 50, y: 75 },
    { position: 'CB', x: 30, y: 73 },
    { position: 'RM', x: 85, y: 45 },
    { position: 'CM', x: 65, y: 48 },
    { position: 'CM', x: 50, y: 50 },
    { position: 'CM', x: 35, y: 48 },
    { position: 'LM', x: 15, y: 45 },
    { position: 'ST', x: 60, y: 18 },
    { position: 'ST', x: 40, y: 18 },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 92 },
    { position: 'RB', x: 80, y: 70 },
    { position: 'CB', x: 60, y: 73 },
    { position: 'CB', x: 40, y: 73 },
    { position: 'LB', x: 20, y: 70 },
    { position: 'CM', x: 60, y: 55 },
    { position: 'CM', x: 40, y: 55 },
    { position: 'RW', x: 75, y: 30 },
    { position: 'CAM', x: 50, y: 32 },
    { position: 'LW', x: 25, y: 30 },
    { position: 'ST', x: 50, y: 15 },
  ],
};

export function getFormationSlots(formation: string): FormationSlot[] {
  return formations[formation] ?? formations['4-4-2'];
}

export function getPlayersByTeam(players: Player[], team: 'A' | 'B'): Player[] {
  return players.filter((p) => p.team === team);
}
