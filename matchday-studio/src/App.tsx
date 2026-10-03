import { useState } from 'react';
import { allDesigns } from '@/data/designs';
import { colorFamilies } from '@/data/colorFamilies';
import { DesignCard } from '@/components/DesignCard';
import { DesignDetail } from '@/components/DesignDetail';
import { QFKCrest } from '@/components/QFKCrest';
import { FormationSetup } from '@/components/formation/FormationSetup';
import type { DesignSpec } from '@/types';

type AppView = 'gallery' | 'formation';

export default function App() {
  const [view, setView] = useState<AppView>('formation');
  const [selected, setSelected] = useState<DesignSpec | null>(null);
  const [activeFamily, setActiveFamily] = useState<number | null>(null);

  const filtered = activeFamily
    ? allDesigns.filter((d) => d.familyId === activeFamily)
    : allDesigns;

  if (view === 'gallery' && selected) {
    return <DesignDetail spec={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <QFKCrest size={36} />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight sm:text-base">QFK Matchday Studio</h1>
              <p className="hidden text-[10px] text-neutral-500 sm:block">Qatar Football Koottam — Doha</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            <a href="../index.html" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800">QFK Finance</a>
            <NavBtn label="Formation Setup" active={view === 'formation'} onClick={() => setView('formation')} />
            <NavBtn label="Poster Gallery" active={view === 'gallery'} onClick={() => setView('gallery')} />
          </nav>
        </div>
      </header>

      {view === 'formation' && <FormationSetup />}

      {view === 'gallery' && (
        <>
          {/* Family filter bar */}
          <div className="sticky top-[57px] z-20 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-8">
              <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-thin">
                <FilterChip
                  label="All Designs"
                  active={activeFamily === null}
                  onClick={() => setActiveFamily(null)}
                  count={allDesigns.length}
                />
                {colorFamilies.map((fam) => {
                  const count = allDesigns.filter((d) => d.familyId === fam.id).length;
                  return (
                    <FilterChip
                      key={fam.id}
                      label={fam.name}
                      active={activeFamily === fam.id}
                      onClick={() => setActiveFamily(fam.id)}
                      count={count}
                      swatches={fam.swatches.map((s) => s.hex)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gallery grid */}
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-neutral-200">
                {activeFamily
                  ? `${colorFamilies.find((f) => f.id === activeFamily)?.name} Collection`
                  : 'All Poster Designs'}
              </h2>
              <span className="text-sm text-neutral-500">
                {filtered.length} of 100 designs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((spec) => (
                <DesignCard key={spec.id} spec={spec} onClick={() => setSelected(spec)} />
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
              <p className="text-sm text-neutral-500">
                99 more designs coming across 10 color families — QFK-002 through QFK-100
              </p>
            </div>
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6">
        <div className="mb-2 text-center"><a href="../studio/index.html" className="text-xs text-neutral-400 underline">Open previous local studio</a></div>
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-neutral-600 sm:px-8">
          QFK — Qatar Football Koottam, Doha · Play • Share • Grow · More Than A Game
        </div>
      </footer>
    </div>
  );
}

function NavBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
        active
          ? 'bg-amber-500 text-neutral-950'
          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
  swatches?: string[];
}

function FilterChip({ label, active, onClick, count, swatches }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-amber-500 text-neutral-950'
          : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
      }`}
    >
      {swatches && (
        <span className="flex gap-0.5">
          {swatches.map((hex) => (
            <span key={hex} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
          ))}
        </span>
      )}
      {label}
      <span className={`text-[10px] ${active ? 'text-neutral-800' : 'text-neutral-600'}`}>
        {count}
      </span>
    </button>
  );
}
