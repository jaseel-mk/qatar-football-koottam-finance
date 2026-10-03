interface CrestProps {
  size?: number;
  className?: string;
}

export function QFKCrest({ size = 80, className }: CrestProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label="QFK crest"
    >
      <defs>
        <linearGradient id="crestShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a1240" />
          <stop offset="100%" stopColor="#4d0a20" />
        </linearGradient>
        <linearGradient id="crestGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9B86E" />
          <stop offset="100%" stopColor="#A8832E" />
        </linearGradient>
      </defs>
      {/* Shield outline */}
      <path
        d="M50 4 L92 14 V46 C92 68 74 86 50 96 C26 86 8 68 8 46 V14 Z"
        fill="url(#crestShield)"
        stroke="url(#crestGold)"
        strokeWidth="2.5"
      />
      {/* Inner shield border */}
      <path
        d="M50 10 L86 18 V45 C86 64 71 79 50 88 C29 79 14 64 14 45 V18 Z"
        fill="none"
        stroke="#C9A35B"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Football */}
      <circle cx="50" cy="34" r="11" fill="#F4EBDD" stroke="#C9A35B" strokeWidth="1.2" />
      <path
        d="M50 27 L53.5 30.5 L52 35 L48 35 L46.5 30.5 Z"
        fill="#650D2B"
        stroke="#650D2B"
        strokeWidth="0.3"
      />
      <line x1="50" y1="27" x2="50" y2="23" stroke="#C9A35B" strokeWidth="0.8" />
      <line x1="53.5" y1="30.5" x2="58" y2="29" stroke="#C9A35B" strokeWidth="0.8" />
      <line x1="46.5" y1="30.5" x2="42" y2="29" stroke="#C9A35B" strokeWidth="0.8" />
      <line x1="52" y1="35" x2="55" y2="39" stroke="#C9A35B" strokeWidth="0.8" />
      <line x1="48" y1="35" x2="45" y2="39" stroke="#C9A35B" strokeWidth="0.8" />
      {/* QFK text */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill="#F4EBDD"
        fontFamily="'Oswald', sans-serif"
        letterSpacing="1"
      >
        QFK
      </text>
      {/* Laurels */}
      <path
        d="M28 66 Q35 72 42 74"
        fill="none"
        stroke="#C9A35B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M72 66 Q65 72 58 74"
        fill="none"
        stroke="#C9A35B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Laurel leaves */}
      {[-8, -4, 0, 4, 8].map((dx, i) => (
        <ellipse
          key={`l-${i}`}
          cx={30 + Math.abs(dx) * 1.5}
          cy={70 + dx * 0.3}
          rx="2.5"
          ry="1.2"
          fill="#C9A35B"
          opacity="0.7"
          transform={`rotate(${-30 + dx * 3} ${30 + Math.abs(dx) * 1.5} ${70 + dx * 0.3})`}
        />
      ))}
      {[-8, -4, 0, 4, 8].map((dx, i) => (
        <ellipse
          key={`r-${i}`}
          cx={70 - Math.abs(dx) * 1.5}
          cy={70 + dx * 0.3}
          rx="2.5"
          ry="1.2"
          fill="#C9A35B"
          opacity="0.7"
          transform={`rotate(${30 - dx * 3} ${70 - Math.abs(dx) * 1.5} ${70 + dx * 0.3})`}
        />
      ))}
      {/* Banner */}
      <rect x="32" y="78" width="36" height="10" rx="2" fill="#C9A35B" opacity="0.9" />
      <text
        x="50"
        y="85.5"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="600"
        fill="#4d0a20"
        fontFamily="'Oswald', sans-serif"
        letterSpacing="0.5"
      >
        DOHA
      </text>
    </svg>
  );
}
