import type { DesignSpec } from '@/types';
import { PosterRenderer } from '@/components/PosterRenderer';
import { QFKCrest } from '@/components/QFKCrest';

interface DesignDetailProps {
  spec: DesignSpec;
  onBack: () => void;
}

export function DesignDetail({ spec, onBack }: DesignDetailProps) {
  return (
    <div className="qfk-ui min-h-screen bg-neutral-950 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/90 px-4 py-3 backdrop-blur-md sm:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <span className="text-lg leading-none">&larr;</span> Gallery
        </button>
        <div className="flex items-center gap-2">
          <QFKCrest size={28} />
          <span className="text-sm font-bold tracking-wide text-amber-500">QFK Matchday Studio</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{spec.id}</h1>
            <span className="text-lg text-amber-500 sm:text-xl">{spec.themeName}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Family {spec.familyId}: {spec.familyName}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Left: Poster + sections */}
          <div className="space-y-8">
            {/* Poster preview */}
            <div className="overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-neutral-800">
              <div className="flex justify-center p-4">
                <div className="w-full max-w-[480px]">
                  <PosterRenderer spec={spec} match={spec.preview} width={480} height={640} className="w-full" />
                </div>
              </div>
            </div>

            {/* Composition & Lighting */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoBlock title="Composition" body={spec.composition} />
              <InfoBlock title="Lighting" body={spec.lighting} />
            </div>

            {/* Background prompt */}
            <InfoBlock title="Background Image-Generation Prompt" body={spec.bgPrompt} mono />

            {/* Transparent assets */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-500">
                Required Transparent Assets
              </h3>
              <ul className="space-y-2">
                {spec.transparentAssets.map((asset, i) => (
                  <li key={i} className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
                    <span className="font-mono text-amber-500/70 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span>{asset}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Placement plan */}
            <InfoBlock title="Placement Plan — Dynamic Text & Lineup" body={spec.placementPlan} />
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Palette */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-500">Color Palette</h3>
              <div className="space-y-3">
                {spec.palette.map((sw) => (
                  <div key={sw.hex} className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg border border-white/10 shrink-0"
                      style={{ backgroundColor: sw.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{sw.name}</div>
                      <div className="text-xs font-mono text-neutral-400">{sw.hex}</div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{sw.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview match data */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-500">Preview Match Data</h3>
              <dl className="space-y-2.5 text-sm">
                <DataRow label="Match No." value={`#${spec.preview.matchNumber}`} />
                <DataRow label="Title" value={spec.preview.matchTitle} />
                <DataRow label="Date" value={spec.preview.dateDay} />
                <DataRow label="Time" value={`${spec.preview.startTime} – ${spec.preview.endTime}`} />
                <DataRow label="Venue" value={spec.preview.venue} />
                <DataRow label="Team A" value={`${spec.preview.teamA.name} (${spec.preview.teamA.formation})`} />
                <DataRow label="Team B" value={`${spec.preview.teamB.name} (${spec.preview.teamB.formation})`} />
                <DataRow label="Players" value={`${spec.preview.players.length} on pitch`} />
                <DataRow label="Subs" value={`${spec.preview.subs.length} on bench`} />
                {spec.preview.fee && <DataRow label="Fee" value={spec.preview.fee} />}
                {spec.preview.bookingStatus && <DataRow label="Booking" value={spec.preview.bookingStatus} />}
                <DataRow label="Status" value={spec.preview.draftStatus} />
              </dl>
            </div>

            {/* Export formats */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-500">Export Formats</h3>
              <div className="space-y-2 text-sm">
                <FormatRow label="Primary (portrait)" dims="2400 × 3200" />
                <FormatRow label="Instagram portrait" dims="1080 × 1350" />
                <FormatRow label="Story / Reel" dims="1080 × 1920" />
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Content is rearranged per format — never stretched or blindly cropped.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, body, mono }: { title: string; body: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-500">{title}</h3>
      <p className={`text-sm leading-relaxed text-neutral-300 ${mono ? 'font-mono text-xs' : ''}`}>
        {body}
      </p>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-200">{value}</dd>
    </div>
  );
}

function FormatRow({ label, dims }: { label: string; dims: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
      <span className="text-neutral-400">{label}</span>
      <span className="font-mono text-neutral-200">{dims}</span>
    </div>
  );
}
