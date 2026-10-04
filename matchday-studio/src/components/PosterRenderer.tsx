import type { DesignSpec, MatchData } from '@/types';
import { QFKCrest } from '@/components/QFKCrest';
import { FormationPitch } from '@/components/FormationPitch';
import { getPlayersByTeam } from '@/utils/formation';

interface PosterRendererProps {
  spec: DesignSpec;
  match: MatchData;
  width?: number;
  height?: number;
  className?: string;
}

export function PosterRenderer({
  spec,
  match,
  width = 600,
  height = 800,
  className,
}: PosterRendererProps) {
  const W = 2400;
  const H = 3200;
  const safe = 120; // 5%

  const teamAPlayers = getPlayersByTeam(match.players, 'A');
  const teamBPlayers = getPlayersByTeam(match.players, 'B');

  const burgundy = spec.palette[0].hex;
  const ivory = spec.palette[1].hex;
  const gold = spec.palette[2].hex;

  return (
    <div
      className={className}
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Burgundy atmospheric gradient */}
          <linearGradient id="atmosphere" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0309" />
            <stop offset="25%" stopColor="#3d0815" />
            <stop offset="50%" stopColor="#650D2B" />
            <stop offset="75%" stopColor="#4d0a20" />
            <stop offset="100%" stopColor="#2a0510" />
          </linearGradient>

          {/* Floodlight cone gradients */}
          <linearGradient id="floodlightLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff5e6" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#fff5e6" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#fff5e6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="floodlightRight" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5e6" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#fff5e6" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#fff5e6" stopOpacity="0" />
          </linearGradient>

          {/* Grass gradient */}
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a5d2e" />
            <stop offset="50%" stopColor="#246b36" />
            <stop offset="100%" stopColor="#1a5d2e" />
          </linearGradient>

          {/* Mowing stripe pattern */}
          <pattern id="mowStripes" width="240" height="400" patternUnits="userSpaceOnUse">
            <rect width="240" height="400" fill="#1e6332" />
            <rect x="0" width="120" height="400" fill="#237039" />
          </pattern>

          {/* Lower band gradient */}
          <linearGradient id="lowerBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d0815" />
            <stop offset="100%" stopColor="#1a0309" />
          </linearGradient>

          {/* Gold gradient for text */}
          <linearGradient id="goldText" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9B86E" />
            <stop offset="100%" stopColor="#A8832E" />
          </linearGradient>

          {/* Vignette */}
          <radialGradient id="vignette" cx="0.5" cy="0.4" r="0.7">
            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
          </radialGradient>

          {/* Doha skyline mask */}
          <linearGradient id="skylineFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* === BACKGROUND LAYER === */}

        {/* Sky / atmosphere */}
        <rect x="0" y="0" width={W} height={H} fill="url(#atmosphere)" />

        {/* Floodlight cones */}
        <polygon points={`0,0 ${W * 0.55},${H * 0.5} 0,${H * 0.35}`} fill="url(#floodlightLeft)" />
        <polygon points={`${W},0 ${W * 0.45},${H * 0.5} ${W},${H * 0.35}`} fill="url(#floodlightRight)" />

        {/* Stadium stands silhouette */}
        <g opacity="0.5">
          <path
            d={`M 0 ${H * 0.28} Q ${W * 0.15} ${H * 0.24} ${W * 0.3} ${H * 0.27} L ${W * 0.35} ${H * 0.25} L ${W * 0.4} ${H * 0.28} Q ${W * 0.5} ${H * 0.23} ${W * 0.6} ${H * 0.28} L ${W * 0.65} ${H * 0.25} L ${W * 0.7} ${H * 0.27} Q ${W * 0.85} ${H * 0.24} ${W} ${H * 0.28} L ${W} ${H * 0.34} L 0 ${H * 0.34} Z`}
            fill="#1a0309"
          />
        </g>

        {/* Doha skyline silhouette */}
        <g opacity="0.35" transform={`translate(0, ${H * 0.26})`}>
          {/* Aspire Tower */}
          <rect x={W * 0.46} y="-60" width="12" height="60" fill="#0a0205" />
          <circle cx={W * 0.46 + 6} cy="-70" r="8" fill="#0a0205" />
          {/* Buildings */}
          <rect x={W * 0.10} y="-35" width="40" height="35" fill="#0a0205" />
          <rect x={W * 0.16} y="-50" width="30" height="50" fill="#0a0205" />
          <rect x={W * 0.22} y="-30" width="45" height="30" fill="#0a0205" />
          <rect x={W * 0.30} y="-45" width="35" height="45" fill="#0a0205" />
          <rect x={W * 0.52} y="-40" width="50" height="40" fill="#0a0205" />
          <rect x={W * 0.60} y="-55" width="30" height="55" fill="#0a0205" />
          <rect x={W * 0.66} y="-35" width="40" height="35" fill="#0a0205" />
          <rect x={W * 0.74} y="-48" width="35" height="48" fill="#0a0205" />
          <rect x={W * 0.82} y="-30" width="50" height="30" fill="#0a0205" />
          <rect x={W * 0.88} y="-42" width="30" height="42" fill="#0a0205" />
          {/* Tiny window lights */}
          {Array.from({ length: 30 }).map((_, i) => (
            <rect
              key={`win-${i}`}
              x={W * 0.10 + (i * 27) % (W * 0.8)}
              y={-20 - ((i * 13) % 35)}
              width="2"
              height="2"
              fill="#C9A35B"
              opacity="0.6"
            />
          ))}
        </g>

        {/* Grass pitch area */}
        <rect x="0" y={H * 0.30} width={W} height={H * 0.50} fill="url(#mowStripes)" />

        {/* Grass edge shadow from stands */}
        <rect x="0" y={H * 0.30} width={W} height="40" fill="#000000" opacity="0.25" />

        {/* Pitch markings on the grass */}
        <g stroke="#F4EBDD" strokeWidth="2" fill="none" opacity="0.25">
          <rect x={safe + 20} y={H * 0.32} width={W - (safe + 20) * 2} height={H * 0.46} rx="4" />
          <line x1={safe + 20} y1={H * 0.55} x2={W - safe - 20} y2={H * 0.55} />
          <circle cx={W / 2} cy={H * 0.55} r="80" />
        </g>

        {/* Vignette overlay */}
        <rect x="0" y="0" width={W} height={H} fill="url(#vignette)" />

        {/* === CONTENT LAYER === */}

        {/* Gold hairline - top zone separator */}
        <line x1={safe} y1={H * 0.33} x2={W - safe} y2={H * 0.33} stroke={gold} strokeWidth="2" opacity="0.6" />

        {/* === UPPER THIRD: Header === */}
        <g transform={`translate(${W / 2}, ${safe + 40})`}>
          {/* Crest */}
          <g transform="translate(-60, 0) scale(1.2)">
            <QFKCrest size={100} />
          </g>

          {/* Match number */}
          <text
            x={-W / 2 + safe + 20}
            y="50"
            fontSize="36"
            fontWeight="700"
            fill="url(#goldText)"
            fontFamily="'Oswald', sans-serif"
            letterSpacing="2"
          >
            MATCH {String(match.matchNumber).padStart(3, '0')}
          </text>

          {/* Match title */}
          <text
            x="0"
            y="170"
            textAnchor="middle"
            fontSize="52"
            fontWeight="800"
            fill={ivory}
            fontFamily="'Oswald', sans-serif"
            letterSpacing="1"
          >
            {match.matchTitle.toUpperCase()}
          </text>

          {/* Signature phrase */}
          <text
            x="0"
            y="215"
            textAnchor="middle"
            fontSize="22"
            fontWeight="500"
            fill={gold}
            fontFamily="'Oswald', sans-serif"
            letterSpacing="6"
          >
            PLAY • SHARE • GROW
          </text>
        </g>

        {/* === MIDDLE ZONE: Lineups === */}
        <g transform={`translate(0, ${H * 0.36})`}>
          {/* Vertical divider */}
          <line x1={W / 2} y1="0" x2={W / 2} y2={H * 0.30} stroke={gold} strokeWidth="1.5" opacity="0.4" />

          {/* Team A header */}
          <g transform={`translate(${W * 0.25}, 10)`}>
            <rect x="-180" y="0" width="360" height="56" rx="28" fill={burgundy} stroke={gold} strokeWidth="1.5" />
            <text x="0" y="36" textAnchor="middle" fontSize="28" fontWeight="800" fill={ivory} fontFamily="'Oswald', sans-serif" letterSpacing="1">
              {match.teamA.name.toUpperCase()}
            </text>
            <text x="0" y="-8" textAnchor="middle" fontSize="14" fontWeight="600" fill={gold} fontFamily="'Oswald', sans-serif" letterSpacing="2">
              {match.teamA.formation}
            </text>
          </g>

          {/* Team B header */}
          <g transform={`translate(${W * 0.75}, 10)`}>
            <rect x="-180" y="0" width="360" height="56" rx="28" fill={ivory} stroke={gold} strokeWidth="1.5" />
            <text x="0" y="36" textAnchor="middle" fontSize="28" fontWeight="800" fill={burgundy} fontFamily="'Oswald', sans-serif" letterSpacing="1">
              {match.teamB.name.toUpperCase()}
            </text>
            <text x="0" y="-8" textAnchor="middle" fontSize="14" fontWeight="600" fill={gold} fontFamily="'Oswald', sans-serif" letterSpacing="2">
              {match.teamB.formation}
            </text>
          </g>

          {/* Team A formation pitch */}
          <g transform={`translate(${safe + 20}, 80)`}>
            <FormationPitch
              players={teamAPlayers}
              formation={match.teamA.formation}
              kit={match.teamA.kit}
              width={W * 0.42 - safe}
              height={H * 0.22}
            />
          </g>

          {/* Team B formation pitch */}
          <g transform={`translate(${W * 0.5 + 10}, 80)`}>
            <FormationPitch
              players={teamBPlayers}
              formation={match.teamB.formation}
              kit={match.teamB.kit}
              width={W * 0.42 - safe}
              height={H * 0.22}
              flip
            />
          </g>

          {/* Substitutes strip */}
          <g transform={`translate(0, ${H * 0.24})`}>
            <line x1={safe} y1="0" x2={W - safe} y2="0" stroke={gold} strokeWidth="1" opacity="0.3" />
            <text x={safe + 10} y="22" fontSize="14" fontWeight="700" fill={gold} fontFamily="'Oswald', sans-serif" letterSpacing="2">
              SUBSTITUTES
            </text>

            {/* Team A subs */}
            {match.subs.filter((s) => s.team === 'A').map((sub, i) => (
              <g key={`subA-${i}`} transform={`translate(${safe + 20 + i * 130}, 40)`}>
                <circle cx="0" cy="10" r="14" fill={burgundy} stroke={gold} strokeWidth="1" />
                <text x="0" y="14" textAnchor="middle" fontSize="11" fontWeight="800" fill={ivory} fontFamily="'Oswald', sans-serif">
                  {sub.number}
                </text>
                <text x="20" y="14" fontSize="12" fontWeight="600" fill={ivory} fontFamily="'Inter', sans-serif">
                  {sub.name}
                </text>
              </g>
            ))}

            {/* Team B subs */}
            {match.subs.filter((s) => s.team === 'B').map((sub, i) => (
              <g key={`subB-${i}`} transform={`translate(${W * 0.52 + i * 130}, 40)`}>
                <circle cx="0" cy="10" r="14" fill={ivory} stroke={gold} strokeWidth="1" />
                <text x="0" y="14" textAnchor="middle" fontSize="11" fontWeight="800" fill={burgundy} fontFamily="'Oswald', sans-serif">
                  {sub.number}
                </text>
                <text x="20" y="14" fontSize="12" fontWeight="600" fill={ivory} fontFamily="'Inter', sans-serif">
                  {sub.name}
                </text>
              </g>
            ))}
          </g>
        </g>

        {/* Gold hairline - lower zone separator */}
        <line x1={safe} y1={H * 0.83} x2={W - safe} y2={H * 0.83} stroke={gold} strokeWidth="2" opacity="0.6" />

        {/* === LOWER BAND: Match details === */}
        <g transform={`translate(0, ${H * 0.85})`}>
          {/* Date */}
          <text x={safe + 10} y="30" fontSize="20" fontWeight="700" fill={ivory} fontFamily="'Oswald', sans-serif" letterSpacing="1">
            {match.dateDay.toUpperCase()}
          </text>

          {/* Time */}
          <text x={safe + 10} y="62" fontSize="18" fontWeight="500" fill={gold} fontFamily="'Oswald', sans-serif" letterSpacing="1">
            {match.startTime} – {match.endTime}
          </text>

          {/* Venue */}
          <text x={safe + 10} y="92" fontSize="16" fontWeight="400" fill={ivory} fontFamily="'Inter', sans-serif" opacity="0.85">
            {match.venue}
          </text>

          {/* Fee & booking (right side) */}
          {match.fee && (
            <text x={W - safe - 10} y="30" textAnchor="end" fontSize="16" fontWeight="600" fill={gold} fontFamily="'Oswald', sans-serif">
              {match.fee}
            </text>
          )}
          {match.bookingStatus && (
            <text x={W - safe - 10} y="56" textAnchor="end" fontSize="13" fontWeight="400" fill={ivory} fontFamily="'Inter', sans-serif" opacity="0.8">
              {match.bookingStatus}
            </text>
          )}
          {match.paymentDetails && (
            <text x={W - safe - 10} y="78" textAnchor="end" fontSize="13" fontWeight="400" fill={ivory} fontFamily="'Inter', sans-serif" opacity="0.7">
              {match.paymentDetails}
            </text>
          )}

          {/* MORE THAN A GAME */}
          <text x={W / 2} y="120" textAnchor="middle" fontSize="16" fontWeight="500" fill={ivory} fontFamily="'Oswald', sans-serif" letterSpacing="5" opacity="0.7">
            MORE THAN A GAME
          </text>

          {/* Draft status badge */}
          <g transform={`translate(${W - safe - 160}, 135)`}>
            <rect x="0" y="0" width="150" height="34" rx="17" fill={match.draftStatus === 'Confirmed' ? '#246b36' : '#A7313D'} stroke={gold} strokeWidth="1" />
            <text x="75" y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill={ivory} fontFamily="'Oswald', sans-serif" letterSpacing="1">
              {match.draftStatus.toUpperCase()}
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
