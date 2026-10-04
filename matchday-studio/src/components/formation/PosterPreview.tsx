import { downloadPosterPNG } from '@/lib/poster-export';
import { useState, useRef, useCallback } from 'react';
import { PosterSVG } from '@/components/formation/PosterSVG';
import type { PosterData } from '@/components/formation/PosterSVG';
import type { PosterThemeId } from '@/components/formation/PosterSVG';
import { resolveAutoTheme } from '@/lib/formation-types';

interface PosterPreviewProps {
  data: PosterData;
  themeId: string;
  onSaveVersion: (theme: string) => void;
  onChangeTheme: (theme: string) => void;
  onEditFormation: () => void;
}

const THEME_OPTIONS: { id: string; name: string }[] = [
  { id: 'auto', name: 'Auto Rotate' },
  { id: 'stadium', name: 'QFK Stadium' },
  { id: 'matchday', name: 'Matchday' },
  { id: 'split', name: 'Split Pitch' },
  { id: 'premium', name: 'QFK Premium' },
  { id: 'community', name: 'Football Community' },
  { id: 'dynamic', name: 'Dynamic Sports' },
];

export function PosterPreview({ data, themeId, onSaveVersion, onChangeTheme, onEditFormation }: PosterPreviewProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const resolvedTheme = themeId === 'auto' ? resolveAutoTheme(data.matchNumber) : themeId;

  const handleDownloadPNG = useCallback(async () => {
    setIsExporting(true);
    setExportMsg('');
    try {
      const svgEl = svgRef.current?.querySelector('svg');
      if (!svgEl) throw new Error('SVG not found');

      await downloadPosterPNG(svgEl, `QFK-Match-${String(data.matchNumber).padStart(3, '0')}-${resolvedTheme}.png`);
      setExportMsg('Downloaded successfully');
      onSaveVersion(resolvedTheme);
    } catch (err) {
      setExportMsg(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, [data.matchNumber, resolvedTheme, onSaveVersion]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Poster Preview</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={themeId}
            onChange={(e) => onChangeTheme(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
          >
            {THEME_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button onClick={onEditFormation}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
            Edit Formation
          </button>
          <button
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Download PNG'}
          </button>
        </div>
      </div>

      <div ref={svgRef} className="flex justify-center overflow-hidden rounded-2xl bg-neutral-900 p-4 ring-1 ring-neutral-800">
        <div className="w-full max-w-[480px]">
          <PosterSVG data={data} theme={resolvedTheme as PosterThemeId} width={480} height={640} />
        </div>
      </div>

      {exportMsg && (
        <div className={`rounded-lg px-4 py-2 text-sm ${exportMsg.includes('failed') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
          {exportMsg}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs text-neutral-400">
        <span>Theme: <strong className="text-amber-500">{THEME_OPTIONS.find(t => t.id === resolvedTheme)?.name ?? resolvedTheme}</strong></span>
        <span className="text-neutral-600">|</span>
        <span>Match #{data.matchNumber}</span>
        <span className="text-neutral-600">|</span>
        <span>{data.players.filter(p => p.status === 'starter').length} starters · {data.players.filter(p => p.status === 'substitute').length} subs</span>
      </div>
    </div>
  );
}
