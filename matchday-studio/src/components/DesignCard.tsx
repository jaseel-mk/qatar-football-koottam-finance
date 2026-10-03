import type { DesignSpec } from '@/types';
import { PosterRenderer } from '@/components/PosterRenderer';

interface DesignCardProps {
  spec: DesignSpec;
  onClick: () => void;
}

export function DesignCard({ spec, onClick }: DesignCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 text-left transition-all duration-300 hover:ring-2 hover:ring-amber-500/60 hover:shadow-2xl hover:shadow-amber-900/30"
    >
      {/* Poster preview */}
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <PosterRenderer spec={spec} match={spec.preview} width={300} height={400} className="w-full h-full" />
        </div>

        {/* Family badge */}
        <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            {spec.familyName}
          </span>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between gap-2 border-t border-neutral-800 px-3 py-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{spec.id}</div>
          <div className="text-xs text-neutral-400 truncate">{spec.themeName}</div>
        </div>
        {/* Palette dots */}
        <div className="flex gap-1.5 shrink-0">
          {spec.palette.map((sw) => (
            <div
              key={sw.hex}
              className="h-4 w-4 rounded-full border border-white/20"
              style={{ backgroundColor: sw.hex }}
              title={`${sw.name} ${sw.hex}`}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
