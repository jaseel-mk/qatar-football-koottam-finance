import type { BuilderPlayer } from '@/components/formation/FormationBuilder';
import type { SavedFormation } from '@/lib/formation-types';
import { QFKCrest } from '@/components/QFKCrest';

export interface PosterData {
  matchNumber: number;
  matchTitle: string;
  matchDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string | null;
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
  teamAFormation: SavedFormation | null;
  teamBFormation: SavedFormation | null;
  players: BuilderPlayer[];
}

export type PosterThemeId = 'stadium' | 'matchday' | 'split' | 'premium' | 'community' | 'dynamic';

interface PosterSVGProps {
  data: PosterData;
  theme: PosterThemeId;
  width?: number;
  height?: number;
}

const W = 2400;
const H = 3200;
const SAFE = 120;

export function PosterSVG({ data, theme, width = 600, height = 800 }: PosterSVGProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width, height }}
    >
      <ThemeBackground theme={theme} />
      <ThemeContent data={data} theme={theme} />
    </svg>
  );
}

function ThemeBackground({ theme }: { theme: PosterThemeId }) {
  switch (theme) {
    case 'stadium':
      return <StadiumBg />;
    case 'matchday':
      return <MatchdayBg />;
    case 'split':
      return <SplitBg />;
    case 'premium':
      return <PremiumBg />;
    case 'community':
      return <CommunityBg />;
    case 'dynamic':
      return <DynamicBg />;
    default:
      return <StadiumBg />;
  }
}

function ThemeContent({ data, theme }: { data: PosterData; theme: PosterThemeId }) {
  const teamAStarters = data.players.filter((p) => p.team === 'A' && p.status === 'starter');
  const teamBStarters = data.players.filter((p) => p.team === 'B' && p.status === 'starter');
  const teamASubs = data.players.filter((p) => p.team === 'A' && p.status === 'substitute');
  const teamBSubs = data.players.filter((p) => p.team === 'B' && p.status === 'substitute');

  switch (theme) {
    case 'split':
      return <SplitContent data={data} teamAStarters={teamAStarters} teamBStarters={teamBStarters} teamASubs={teamASubs} teamBSubs={teamBSubs} />;
    case 'premium':
      return <PremiumContent data={data} teamAStarters={teamAStarters} teamBStarters={teamBStarters} teamASubs={teamASubs} teamBSubs={teamBSubs} />;
    case 'community':
      return <CommunityContent data={data} teamAStarters={teamAStarters} teamBStarters={teamBStarters} teamASubs={teamASubs} teamBSubs={teamBSubs} />;
    case 'dynamic':
      return <DynamicContent data={data} teamAStarters={teamAStarters} teamBStarters={teamBStarters} teamASubs={teamASubs} teamBSubs={teamBSubs} />;
    case 'matchday':
      return <MatchdayContent data={data} teamAStarters={teamAStarters} teamBStarters={teamBStarters} teamASubs={teamASubs} teamBSubs={teamBSubs} />;
    default:
      return <StadiumContent data={data} teamAStarters={teamAStarters} teamBStarters={teamBStarters} teamASubs={teamASubs} teamBSubs={teamBSubs} />;
  }
}

// === Backgrounds ===

function StadiumBg() {
  return (
    <>
      <defs>
        <linearGradient id="stadium-atm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0309" />
          <stop offset="50%" stopColor="#650D2B" />
          <stop offset="100%" stopColor="#2a0510" />
        </linearGradient>
        <pattern id="stadium-mow" width="240" height="400" patternUnits="userSpaceOnUse">
          <rect width="240" height="400" fill="#1e6332" />
          <rect x="0" width="120" height="400" fill="#237039" />
        </pattern>
        <radialGradient id="stadium-vig" cx="0.5" cy="0.4" r="0.7">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id="stadium-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9B86E" />
          <stop offset="100%" stopColor="#A8832E" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#stadium-atm)" />
      <polygon points={`0,0 ${W*0.55},${H*0.5} 0,${H*0.35}`} fill="#fff5e6" fillOpacity="0.08" />
      <polygon points={`${W},0 ${W*0.45},${H*0.5} ${W},${H*0.35}`} fill="#fff5e6" fillOpacity="0.08" />
      <rect x="0" y={H*0.30} width={W} height={H*0.50} fill="url(#stadium-mow)" />
      <rect x="0" y="0" width={W} height={H} fill="url(#stadium-vig)" />
    </>
  );
}

function MatchdayBg() {
  return (
    <>
      <defs>
        <linearGradient id="matchday-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#081B32" />
          <stop offset="100%" stopColor="#030a14" />
        </linearGradient>
        <linearGradient id="matchday-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E5B949" />
          <stop offset="100%" stopColor="#B89324" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#matchday-bg)" />
      {/* Diagonal accent lines */}
      <line x1="0" y1={H*0.15} x2={W} y2={H*0.12} stroke="#E5B949" strokeWidth="3" opacity="0.15" />
      <line x1="0" y1={H*0.88} x2={W} y2={H*0.85} stroke="#E5B949" strokeWidth="3" opacity="0.15" />
      {/* Spotlight circles */}
      <circle cx={W*0.2} cy={H*0.2} r="300" fill="#E5B949" fillOpacity="0.04" />
      <circle cx={W*0.8} cy={H*0.8} r="300" fill="#E5B949" fillOpacity="0.04" />
    </>
  );
}

function SplitBg() {
  return (
    <>
      <defs>
        <linearGradient id="split-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1746D1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1746D1" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="split-right" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#F7F5EE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F7F5EE" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W/2} height={H} fill="url(#split-left)" />
      <rect x={W/2} y="0" width={W/2} height={H} fill="url(#split-right)" />
      <line x1={W/2} y1="0" x2={W/2} y2={H} stroke="#C9A35B" strokeWidth="4" opacity="0.6" />
    </>
  );
}

function PremiumBg() {
  return (
    <>
      <defs>
        <linearGradient id="premium-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15191F" />
          <stop offset="50%" stopColor="#0d0f14" />
          <stop offset="100%" stopColor="#15191F" />
        </linearGradient>
        <linearGradient id="premium-silver" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#BFC7CE" stopOpacity="0" />
          <stop offset="50%" stopColor="#BFC7CE" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#BFC7CE" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#premium-bg)" />
      <rect x="0" y={H*0.2} width={W} height="2" fill="url(#premium-silver)" />
      <rect x="0" y={H*0.8} width={W} height="2" fill="url(#premium-silver)" />
      {/* Corner accents */}
      <path d={`M ${SAFE} ${SAFE+40} L ${SAFE} ${SAFE} L ${SAFE+40} ${SAFE}`} stroke="#BFC7CE" strokeWidth="2" fill="none" opacity="0.5" />
      <path d={`M ${W-SAFE} ${H-SAFE-40} L ${W-SAFE} ${H-SAFE} L ${W-SAFE-40} ${H-SAFE}`} stroke="#BFC7CE" strokeWidth="2" fill="none" opacity="0.5" />
    </>
  );
}

function CommunityBg() {
  return (
    <>
      <defs>
        <linearGradient id="community-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#103C2F" />
          <stop offset="100%" stopColor="#0a2418" />
        </linearGradient>
        <pattern id="community-mow" width="200" height="300" patternUnits="userSpaceOnUse">
          <rect width="200" height="300" fill="#1a5d2e" />
          <rect x="0" width="100" height="300" fill="#237039" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#community-bg)" />
      <rect x="0" y={H*0.4} width={W} height={H*0.35} fill="url(#community-mow)" opacity="0.3" />
      <circle cx={W*0.5} cy={H*0.5} r="400" fill="#C7AD77" fillOpacity="0.05" />
    </>
  );
}

function DynamicBg() {
  return (
    <>
      <defs>
        <linearGradient id="dynamic-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#101114" />
          <stop offset="50%" stopColor="#1a0a12" />
          <stop offset="100%" stopColor="#101114" />
        </linearGradient>
        <linearGradient id="dynamic-burg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6B1531" stopOpacity="0" />
          <stop offset="50%" stopColor="#6B1531" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6B1531" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#dynamic-bg)" />
      {/* Dynamic diagonal slashes */}
      <polygon points={`0,${H*0.3} ${W*0.6},${H*0.1} ${W*0.7},${H*0.15} 0,${H*0.35}`} fill="url(#dynamic-burg)" />
      <polygon points={`${W},${H*0.7} ${W*0.4},${H*0.9} ${W*0.3},${H*0.85} ${W},${H*0.65}`} fill="url(#dynamic-burg)" />
      <line x1="0" y1={H*0.3} x2={W*0.7} y2={H*0.12} stroke="#D5B46A" strokeWidth="2" opacity="0.3" />
      <line x1={W} y1={H*0.7} x2={W*0.3} y2={H*0.88} stroke="#D5B46A" strokeWidth="2" opacity="0.3" />
    </>
  );
}

// === Content layouts ===

interface ContentProps {
  data: PosterData;
  teamAStarters: BuilderPlayer[];
  teamBStarters: BuilderPlayer[];
  teamASubs: BuilderPlayer[];
  teamBSubs: BuilderPlayer[];
}

const goldColor = '#C9A35B';
const ivoryColor = '#F4EBDD';

function Header({ data, gold = goldColor, ivory = ivoryColor }: { data: PosterData; gold?: string; ivory?: string }) {
  return (
    <g transform={`translate(${W/2}, ${SAFE + 20})`}>
      <foreignObject x="-50" y="0" width="100" height="100">
        <div style={{ width: 100, height: 100 }}><QFKCrest size={100} /></div>
      </foreignObject>
      <text x={-W/2 + SAFE + 10} y="40" fontSize="32" fontWeight="700" fill={gold}
        fontFamily="'Oswald', sans-serif" letterSpacing="2">
        MATCH {String(data.matchNumber).padStart(3, '0')}
      </text>
      <text x="0" y="150" textAnchor="middle" fontSize="46" fontWeight="800" fill={ivory}
        fontFamily="'Oswald', sans-serif" letterSpacing="1">
        {data.matchTitle.toUpperCase()}
      </text>
      <text x="0" y="190" textAnchor="middle" fontSize="20" fontWeight="500" fill={gold}
        fontFamily="'Oswald', sans-serif" letterSpacing="6">
        PLAY • SHARE • GROW
      </text>
    </g>
  );
}

function Footer({ data, gold = goldColor, ivory = ivoryColor, showStatus = true }: { data: PosterData; gold?: string; ivory?: string; showStatus?: boolean }) {
  const formatDate = (d: string) => {
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
  };
  return (
    <g transform={`translate(0, ${H * 0.86})`}>
      <text x={SAFE + 10} y="30" fontSize="20" fontWeight="700" fill={ivory} fontFamily="'Oswald', sans-serif">
        {formatDate(data.matchDate).toUpperCase()}
      </text>
      <text x={SAFE + 10} y="60" fontSize="18" fontWeight="500" fill={gold} fontFamily="'Oswald', sans-serif">
        {data.startTime} – {data.endTime}
      </text>
      <text x={SAFE + 10} y="88" fontSize="16" fontWeight="400" fill={ivory} fontFamily="'Inter', sans-serif" opacity="0.85">
        {data.venue}
      </text>
      <text x={W/2} y="118" textAnchor="middle" fontSize="16" fontWeight="500" fill={ivory}
        fontFamily="'Oswald', sans-serif" letterSpacing="5" opacity="0.7">
        MORE THAN A GAME
      </text>
      {showStatus && (
        <g transform={`translate(${W - SAFE - 160}, 125)`}>
          <rect x="0" y="0" width="150" height="32" rx="16"
            fill={data.teamAName ? '#246b36' : '#A7313D'} stroke={gold} strokeWidth="1" />
          <text x="75" y="21" textAnchor="middle" fontSize="13" fontWeight="700" fill={ivory}
            fontFamily="'Oswald', sans-serif">CONFIRMED</text>
        </g>
      )}
    </g>
  );
}

function TeamPill({ name, formation, bg, fg, gold, x }: { name: string; formation: string; bg: string; fg: string; gold: string; x: number }) {
  return (
    <g transform={`translate(${x}, 10)`}>
      <rect x="-160" y="0" width="320" height="50" rx="25" fill={bg} stroke={gold} strokeWidth="1.5" />
      <text x="0" y="32" textAnchor="middle" fontSize="24" fontWeight="800" fill={fg}
        fontFamily="'Oswald', sans-serif" letterSpacing="1">{name.toUpperCase()}</text>
      <text x="0" y="-6" textAnchor="middle" fontSize="13" fontWeight="600" fill={gold}
        fontFamily="'Oswald', sans-serif" letterSpacing="2">{formation}</text>
    </g>
  );
}

function PlayerTokenSVG({ player, x, y, primary, secondary, textColor, gkColor, scale = 1 }: {
  player: BuilderPlayer; x: number; y: number; primary: string; secondary: string; textColor: string; gkColor: string; scale?: number;
}) {
  const r = 18 * scale;
  const isGK = player.position === 'GK';
  const bg = isGK ? gkColor : primary;
  const fg = isGK ? '#F4EBDD' : textColor;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="0" r={r} fill={bg} stroke={secondary} strokeWidth="2" />
      <text x="0" y={r * 0.35} textAnchor="middle" fontSize={r * 0.7} fontWeight="800" fill={fg}
        fontFamily="'Oswald', sans-serif">{player.jersey_number}</text>
      <text x="0" y={r * 1.8} textAnchor="middle" fontSize={r * 0.42} fontWeight="600" fill={ivoryColor}
        fontFamily="'Inter', sans-serif">{player.name}</text>
      <text x="0" y={r * 2.5} textAnchor="middle" fontSize={r * 0.35} fontWeight="500" fill={goldColor}
        fontFamily="'Oswald', sans-serif" letterSpacing="0.5">{player.position}</text>
    </g>
  );
}

function SubsStrip({ subsA, subsB, teamAPrimary, teamAText, teamBPrimary, teamBText, gold, ivory }: {
  subsA: BuilderPlayer[]; subsB: BuilderPlayer[];
  teamAPrimary: string; teamAText: string; teamBPrimary: string; teamBText: string;
  gold: string; ivory: string;
}) {
  return (
    <g transform={`translate(0, ${H * 0.77})`}>
      <line x1={SAFE} y1="0" x2={W - SAFE} y2="0" stroke={gold} strokeWidth="1" opacity="0.3" />
      <text x={SAFE + 10} y="22" fontSize="14" fontWeight="700" fill={gold}
        fontFamily="'Oswald', sans-serif" letterSpacing="2">SUBSTITUTES</text>
      {subsA.map((s, i) => (
        <g key={s.id} transform={`translate(${SAFE + 20 + i * 130}, 35)`}>
          <circle cx="0" cy="10" r="13" fill={teamAPrimary} stroke={gold} strokeWidth="1" />
          <text x="0" y="14" textAnchor="middle" fontSize="10" fontWeight="800" fill={teamAText}
            fontFamily="'Oswald', sans-serif">{s.jersey_number}</text>
          <text x="18" y="14" fontSize="11" fontWeight="600" fill={ivory}
            fontFamily="'Inter', sans-serif">{s.name}</text>
        </g>
      ))}
      {subsB.map((s, i) => (
        <g key={s.id} transform={`translate(${W * 0.52 + i * 130}, 35)`}>
          <circle cx="0" cy="10" r="13" fill={teamBPrimary} stroke={gold} strokeWidth="1" />
          <text x="0" y="14" textAnchor="middle" fontSize="10" fontWeight="800" fill={teamBText}
            fontFamily="'Oswald', sans-serif">{s.jersey_number}</text>
          <text x="18" y="14" fontSize="11" fontWeight="600" fill={ivory}
            fontFamily="'Inter', sans-serif">{s.name}</text>
        </g>
      ))}
    </g>
  );
}

function FormationPitchSVG({ starters, formation, primary, secondary, textColor, gkColor, originX, originY, pitchW, pitchH, flip }: {
  starters: BuilderPlayer[]; formation: SavedFormation | null;
  primary: string; secondary: string; textColor: string; gkColor: string;
  originX: number; originY: number; pitchW: number; pitchH: number; flip?: boolean;
}) {
  const slots = formation?.positions ?? [];
  return (
    <g transform={`translate(${originX}, ${originY})`}>
      <rect x="0" y="0" width={pitchW} height={pitchH} rx="4" fill="#1e6332" />
      <g stroke="#F4EBDD" strokeWidth="1.5" fill="none" opacity="0.4">
        <rect x="4" y="4" width={pitchW - 8} height={pitchH - 8} rx="2" />
        <line x1="4" y1={pitchH * 0.5} x2={pitchW - 4} y2={pitchH * 0.5} />
        <circle cx={pitchW / 2} cy={pitchH / 2} r={Math.min(pitchW, pitchH) * 0.1} />
        <rect x={pitchW * 0.25} y="4" width={pitchW * 0.5} height={pitchH * 0.16} />
        <rect x={pitchW * 0.36} y="4" width={pitchW * 0.28} height={pitchH * 0.07} />
        <rect x={pitchW * 0.25} y={pitchH * 0.84} width={pitchW * 0.5} height={pitchH * 0.16} />
        <rect x={pitchW * 0.36} y={pitchH * 0.93} width={pitchW * 0.28} height={pitchH * 0.07} />
      </g>
      {slots.map((slot, i) => {
        const player = starters.find((p) => p.slot_index === i);
        if (!player) return null;
        const sx = flip ? 100 - slot.x : slot.x;
        const sy = flip ? 100 - slot.y : slot.y;
        return (
          <PlayerTokenSVG key={player.id} player={player}
            x={(sx / 100) * pitchW} y={(sy / 100) * pitchH}
            primary={primary} secondary={secondary} textColor={textColor} gkColor={gkColor}
            scale={0.9}
          />
        );
      })}
    </g>
  );
}

// Stadium: burgundy floodlit, split formation
function StadiumContent(p: ContentProps) {
  const pitchW = W * 0.42 - SAFE;
  const pitchH = H * 0.22;
  return (
    <>
      <line x1={SAFE} y1={H * 0.33} x2={W - SAFE} y2={H * 0.33} stroke={goldColor} strokeWidth="2" opacity="0.6" />
      <Header data={p.data} />
      <g transform={`translate(0, ${H * 0.36})`}>
        <line x1={W/2} y1="0" x2={W/2} y2={H*0.30} stroke={goldColor} strokeWidth="1.5" opacity="0.4" />
        <TeamPill name={p.data.teamAName} formation={p.data.teamAFormation?.code ?? ''} bg={p.data.teamAPrimary} fg={p.data.teamAText} gold={goldColor} x={W*0.25} />
        <TeamPill name={p.data.teamBName} formation={p.data.teamBFormation?.code ?? ''} bg={p.data.teamBPrimary} fg={p.data.teamBText} gold={goldColor} x={W*0.75} />
        <FormationPitchSVG starters={p.teamAStarters} formation={p.data.teamAFormation}
          primary={p.data.teamAPrimary} secondary={p.data.teamASecondary} textColor={p.data.teamAText} gkColor={p.data.teamAGK}
          originX={SAFE + 20} originY={75} pitchW={pitchW} pitchH={pitchH} />
        <FormationPitchSVG starters={p.teamBStarters} formation={p.data.teamBFormation}
          primary={p.data.teamBPrimary} secondary={p.data.teamBSecondary} textColor={p.data.teamBText} gkColor={p.data.teamBGK}
          originX={W * 0.5 + 10} originY={75} pitchW={pitchW} pitchH={pitchH} flip />
      </g>
      <SubsStrip subsA={p.teamASubs} subsB={p.teamBSubs}
        teamAPrimary={p.data.teamAPrimary} teamAText={p.data.teamAText}
        teamBPrimary={p.data.teamBPrimary} teamBText={p.data.teamBText}
        gold={goldColor} ivory={ivoryColor} />
      <line x1={SAFE} y1={H*0.83} x2={W-SAFE} y2={H*0.83} stroke={goldColor} strokeWidth="2" opacity="0.6" />
      <Footer data={p.data} />
    </>
  );
}

function MatchdayContent(p: ContentProps) {
  const gold = '#E5B949';
  const ivory = '#F5F7FA';
  return (
    <>
      <Header data={p.data} gold={gold} ivory={ivory} />
      <g transform={`translate(0, ${H * 0.38})`}>
        {/* VS badge */}
        <g transform={`translate(${W/2}, ${H*0.05})`}>
          <circle cx="0" cy="0" r="50" fill={gold} opacity="0.15" />
          <text x="0" y="12" textAnchor="middle" fontSize="40" fontWeight="800" fill={gold}
            fontFamily="'Oswald', sans-serif">VS</text>
        </g>
        <TeamPill name={p.data.teamAName} formation={p.data.teamAFormation?.code ?? ''} bg={p.data.teamAPrimary} fg={p.data.teamAText} gold={gold} x={W*0.25} />
        <TeamPill name={p.data.teamBName} formation={p.data.teamBFormation?.code ?? ''} bg={p.data.teamBPrimary} fg={p.data.teamBText} gold={gold} x={W*0.75} />
        <FormationPitchSVG starters={p.teamAStarters} formation={p.data.teamAFormation}
          primary={p.data.teamAPrimary} secondary={p.data.teamASecondary} textColor={p.data.teamAText} gkColor={p.data.teamAGK}
          originX={SAFE + 20} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.20} />
        <FormationPitchSVG starters={p.teamBStarters} formation={p.data.teamBFormation}
          primary={p.data.teamBPrimary} secondary={p.data.teamBSecondary} textColor={p.data.teamBText} gkColor={p.data.teamBGK}
          originX={W * 0.5 + 10} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.20} flip />
      </g>
      <SubsStrip subsA={p.teamASubs} subsB={p.teamBSubs}
        teamAPrimary={p.data.teamAPrimary} teamAText={p.data.teamAText}
        teamBPrimary={p.data.teamBPrimary} teamBText={p.data.teamBText}
        gold={gold} ivory={ivory} />
      <Footer data={p.data} gold={gold} ivory={ivory} showStatus={false} />
    </>
  );
}

function SplitContent(p: ContentProps) {
  const pitchH = H * 0.30;
  return (
    <>
      <Header data={p.data} />
      <g transform={`translate(0, ${H * 0.32})`}>
        <TeamPill name={p.data.teamAName} formation={p.data.teamAFormation?.code ?? ''} bg={p.data.teamAPrimary} fg={p.data.teamAText} gold={goldColor} x={W*0.25} />
        <TeamPill name={p.data.teamBName} formation={p.data.teamBFormation?.code ?? ''} bg={p.data.teamBPrimary} fg={p.data.teamBText} gold={goldColor} x={W*0.75} />
        {/* Twin vertical pitches */}
        <FormationPitchSVG starters={p.teamAStarters} formation={p.data.teamAFormation}
          primary={p.data.teamAPrimary} secondary={p.data.teamASecondary} textColor={p.data.teamAText} gkColor={p.data.teamAGK}
          originX={SAFE + 10} originY={75} pitchW={W * 0.44 - SAFE} pitchH={pitchH} />
        <FormationPitchSVG starters={p.teamBStarters} formation={p.data.teamBFormation}
          primary={p.data.teamBPrimary} secondary={p.data.teamBSecondary} textColor={p.data.teamBText} gkColor={p.data.teamBGK}
          originX={W * 0.5 + 10} originY={75} pitchW={W * 0.44 - SAFE} pitchH={pitchH} flip />
      </g>
      <SubsStrip subsA={p.teamASubs} subsB={p.teamBSubs}
        teamAPrimary={p.data.teamAPrimary} teamAText={p.data.teamAText}
        teamBPrimary={p.data.teamBPrimary} teamBText={p.data.teamBText}
        gold={goldColor} ivory={ivoryColor} />
      <Footer data={p.data} />
    </>
  );
}

function PremiumContent(p: ContentProps) {
  const gold = '#BFC7CE';
  const ivory = '#E8ECEF';
  return (
    <>
      <Header data={p.data} gold={gold} ivory={ivory} />
      <g transform={`translate(0, ${H * 0.36})`}>
        <TeamPill name={p.data.teamAName} formation={p.data.teamAFormation?.code ?? ''} bg={p.data.teamAPrimary} fg={p.data.teamAText} gold={gold} x={W*0.25} />
        <TeamPill name={p.data.teamBName} formation={p.data.teamBFormation?.code ?? ''} bg={p.data.teamBPrimary} fg={p.data.teamBText} gold={gold} x={W*0.75} />
        <FormationPitchSVG starters={p.teamAStarters} formation={p.data.teamAFormation}
          primary={p.data.teamAPrimary} secondary={p.data.teamASecondary} textColor={p.data.teamAText} gkColor={p.data.teamAGK}
          originX={SAFE + 20} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.22} />
        <FormationPitchSVG starters={p.teamBStarters} formation={p.data.teamBFormation}
          primary={p.data.teamBPrimary} secondary={p.data.teamBSecondary} textColor={p.data.teamBText} gkColor={p.data.teamBGK}
          originX={W * 0.5 + 10} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.22} flip />
      </g>
      <SubsStrip subsA={p.teamASubs} subsB={p.teamBSubs}
        teamAPrimary={p.data.teamAPrimary} teamAText={p.data.teamAText}
        teamBPrimary={p.data.teamBPrimary} teamBText={p.data.teamBText}
        gold={gold} ivory={ivory} />
      <Footer data={p.data} gold={gold} ivory={ivory} />
    </>
  );
}

function CommunityContent(p: ContentProps) {
  const gold = '#C7AD77';
  const ivory = '#EEE8D8';
  return (
    <>
      <Header data={p.data} gold={gold} ivory={ivory} />
      <g transform={`translate(0, ${H * 0.36})`}>
        <TeamPill name={p.data.teamAName} formation={p.data.teamAFormation?.code ?? ''} bg={p.data.teamAPrimary} fg={p.data.teamAText} gold={gold} x={W*0.25} />
        <TeamPill name={p.data.teamBName} formation={p.data.teamBFormation?.code ?? ''} bg={p.data.teamBPrimary} fg={p.data.teamBText} gold={gold} x={W*0.75} />
        <FormationPitchSVG starters={p.teamAStarters} formation={p.data.teamAFormation}
          primary={p.data.teamAPrimary} secondary={p.data.teamASecondary} textColor={p.data.teamAText} gkColor={p.data.teamAGK}
          originX={SAFE + 20} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.22} />
        <FormationPitchSVG starters={p.teamBStarters} formation={p.data.teamBFormation}
          primary={p.data.teamBPrimary} secondary={p.data.teamBSecondary} textColor={p.data.teamBText} gkColor={p.data.teamBGK}
          originX={W * 0.5 + 10} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.22} flip />
      </g>
      <SubsStrip subsA={p.teamASubs} subsB={p.teamBSubs}
        teamAPrimary={p.data.teamAPrimary} teamAText={p.data.teamAText}
        teamBPrimary={p.data.teamBPrimary} teamBText={p.data.teamBText}
        gold={gold} ivory={ivory} />
      <Footer data={p.data} gold={gold} ivory={ivory} />
    </>
  );
}

function DynamicContent(p: ContentProps) {
  const gold = '#D5B46A';
  const ivory = '#F4EBDD';
  return (
    <>
      <Header data={p.data} gold={gold} ivory={ivory} />
      <g transform={`translate(0, ${H * 0.36})`}>
        <TeamPill name={p.data.teamAName} formation={p.data.teamAFormation?.code ?? ''} bg={p.data.teamAPrimary} fg={p.data.teamAText} gold={gold} x={W*0.25} />
        <TeamPill name={p.data.teamBName} formation={p.data.teamBFormation?.code ?? ''} bg={p.data.teamBPrimary} fg={p.data.teamBText} gold={gold} x={W*0.75} />
        <FormationPitchSVG starters={p.teamAStarters} formation={p.data.teamAFormation}
          primary={p.data.teamAPrimary} secondary={p.data.teamASecondary} textColor={p.data.teamAText} gkColor={p.data.teamAGK}
          originX={SAFE + 20} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.22} />
        <FormationPitchSVG starters={p.teamBStarters} formation={p.data.teamBFormation}
          primary={p.data.teamBPrimary} secondary={p.data.teamBSecondary} textColor={p.data.teamBText} gkColor={p.data.teamBGK}
          originX={W * 0.5 + 10} originY={75} pitchW={W * 0.42 - SAFE} pitchH={H * 0.22} flip />
      </g>
      <SubsStrip subsA={p.teamASubs} subsB={p.teamBSubs}
        teamAPrimary={p.data.teamAPrimary} teamAText={p.data.teamAText}
        teamBPrimary={p.data.teamBPrimary} teamBText={p.data.teamBText}
        gold={gold} ivory={ivory} />
      <Footer data={p.data} gold={gold} ivory={ivory} />
    </>
  );
}
