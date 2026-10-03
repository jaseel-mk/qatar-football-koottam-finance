import type { Player, TeamKit } from '@/types';
import { getFormationSlots } from '@/utils/formation';

interface FormationPitchProps {
  players: Player[];
  formation: string;
  kit: TeamKit;
  width: number;
  height: number;
  flip?: boolean;
}

export function FormationPitch({
  players,
  formation,
  kit,
  width,
  height,
  flip = false,
}: FormationPitchProps) {
  const slots = getFormationSlots(formation);
  const orderedPlayers = players.slice(0, 11);

  const padX = width * 0.06;
  const padY = height * 0.04;
  const pitchW = width - padX * 2;
  const pitchH = height - padY * 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`grass-${kit.primary.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a5d2e" />
          <stop offset="50%" stopColor="#246b36" />
          <stop offset="100%" stopColor="#1a5d2e" />
        </linearGradient>
        <pattern
          id={`mow-${kit.primary.replace('#', '')}`}
          width={pitchW / 10}
          height={pitchH / 12}
          patternUnits="userSpaceOnUse"
        >
          <rect width={pitchW / 10} height={pitchH / 12} fill="#1e6332" />
          <rect
            x={pitchW / 20}
            width={pitchW / 20}
            height={pitchH / 12}
            fill="#237039"
          />
        </pattern>
      </defs>

      {/* Pitch background */}
      <rect x={padX} y={padY} width={pitchW} height={pitchH} rx="4" fill={`url(#mow-${kit.primary.replace('#', '')})`} />

      {/* Pitch markings */}
      <g stroke="#F4EBDD" strokeWidth="1.5" fill="none" opacity="0.7">
        {/* Outer border */}
        <rect x={padX + 4} y={padY + 4} width={pitchW - 8} height={pitchH - 8} rx="2" />
        {/* Center line */}
        <line
          x1={padX + 4}
          y1={padY + pitchH * 0.5}
          x2={padX + pitchW - 4}
          y2={padY + pitchH * 0.5}
        />
        {/* Center circle */}
        <circle cx={padX + pitchW / 2} cy={padY + pitchH / 2} r={Math.min(pitchW, pitchH) * 0.1} />
        <circle cx={padX + pitchW / 2} cy={padY + pitchH / 2} r="2" fill="#F4EBDD" />
        {/* Penalty box top (attacking direction) */}
        <rect
          x={padX + pitchW * 0.25}
          y={padY + 4}
          width={pitchW * 0.5}
          height={pitchH * 0.16}
        />
        {/* 6-yard box top */}
        <rect
          x={padX + pitchW * 0.36}
          y={padY + 4}
          width={pitchW * 0.28}
          height={pitchH * 0.07}
        />
        {/* Penalty spot top */}
        <circle cx={padX + pitchW / 2} cy={padY + pitchH * 0.13} r="1.5" fill="#F4EBDD" />
        {/* Penalty box bottom */}
        <rect
          x={padX + pitchW * 0.25}
          y={padY + pitchH * 0.84}
          width={pitchW * 0.5}
          height={pitchH * 0.16}
        />
        {/* 6-yard box bottom */}
        <rect
          x={padX + pitchW * 0.36}
          y={padY + pitchH * 0.93}
          width={pitchW * 0.28}
          height={pitchH * 0.07}
        />
        {/* Penalty spot bottom */}
        <circle cx={padX + pitchW / 2} cy={padY + pitchH * 0.87} r="1.5" fill="#F4EBDD" />
      </g>

      {/* Players */}
      {slots.map((slot, i) => {
        const player = orderedPlayers[i];
        if (!player) return null;

        const slotX = flip ? 100 - slot.x : slot.x;
        const slotY = flip ? 100 - slot.y : slot.y;
        const px = padX + (slotX / 100) * pitchW;
        const py = padY + (slotY / 100) * pitchH;

        return (
          <PlayerToken
            key={`${player.name}-${player.number}`}
            player={player}
            x={px}
            y={py}
            kit={kit}
          />
        );
      })}
    </svg>
  );
}

interface PlayerTokenProps {
  player: Player;
  x: number;
  y: number;
  kit: TeamKit;
}

function PlayerToken({ player, x, y, kit }: PlayerTokenProps) {
  const r = 16;
  const fontSize = 11;
  const nameFontSize = 7.5;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Jersey body */}
      <path
        d={`M ${-r} ${-r * 0.7} Q ${-r} ${-r * 1.1} ${-r * 0.65} ${-r * 1.15} L ${-r * 0.35} ${-r * 1.3} Q 0 ${-r * 1.45} ${r * 0.35} ${-r * 1.3} L ${r * 0.65} ${-r * 1.15} Q ${r} ${-r * 1.1} ${r} ${-r * 0.7} L ${r * 0.8} ${r * 0.8} Q ${r * 0.7} ${r} 0 ${r} Q ${-r * 0.7} ${r} ${-r * 0.8} ${r * 0.8} Z`}
        fill={kit.primary}
        stroke={kit.secondary}
        strokeWidth="1"
      />
      {/* Collar */}
      <path
        d={`M ${-r * 0.35} ${-r * 1.3} Q 0 ${-r * 0.95} ${r * 0.35} ${-r * 1.3}`}
        fill="none"
        stroke={kit.secondary}
        strokeWidth="1.5"
      />
      {/* Accent stripe */}
      <line
        x1="0"
        y1={-r * 0.9}
        x2="0"
        y2={r * 0.7}
        stroke={kit.accent}
        strokeWidth="0.8"
        opacity="0.6"
      />
      {/* Number */}
      <text
        x="0"
        y={-r * 0.1}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="800"
        fill={kit.secondary}
        fontFamily="'Oswald', sans-serif"
      >
        {player.number}
      </text>
      {/* Name */}
      <text
        x="0"
        y={r * 1.6}
        textAnchor="middle"
        fontSize={nameFontSize}
        fontWeight="600"
        fill="#F4EBDD"
        fontFamily="'Inter', sans-serif"
      >
        {player.name}
      </text>
      {/* Position */}
      <text
        x="0"
        y={r * 2.5}
        textAnchor="middle"
        fontSize={nameFontSize - 1.5}
        fontWeight="500"
        fill="#C9A35B"
        fontFamily="'Oswald', sans-serif"
        letterSpacing="0.5"
      >
        {player.position}
      </text>
    </g>
  );
}
