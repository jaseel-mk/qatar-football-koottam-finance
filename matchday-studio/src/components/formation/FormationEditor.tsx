import { useState, useRef, useCallback } from 'react';
import type { FormationDraftPosition } from '@/lib/formation-types';
import { POSITION_OPTIONS } from '@/lib/formation-types';

interface FormationEditorProps {
  positions: FormationDraftPosition[];
  onChange: (positions: FormationDraftPosition[]) => void;
  width?: number;
  height?: number;
}

export function FormationEditor({
  positions,
  onChange,
  width = 400,
  height = 560,
}: FormationEditorProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setDraggingId(id);
    setEditingId(null);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    onChange(
      positions.map((p) =>
        p.id === draggingId ? { ...p, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } : p,
      ),
    );
  }, [draggingId, positions, onChange]);

  const handlePointerUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  const addPosition = () => {
    const nextOrder = positions.length;
    const newPos: FormationDraftPosition = {
      id: crypto.randomUUID(),
      position_code: 'CM',
      label: 'CM',
      x: 50,
      y: 50,
      display_order: nextOrder,
    };
    onChange([...positions, newPos]);
  };

  const deletePosition = (id: string) => {
    onChange(positions.filter((p) => p.id !== id));
  };

  const updatePosition = (id: string, field: keyof FormationDraftPosition, value: string | number) => {
    onChange(
      positions.map((p) =>
        p.id === id
          ? { ...p, [field]: value, ...(field === 'position_code' ? { label: String(value) } : {}) }
          : p,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={pitchRef}
        className="relative w-full rounded-xl overflow-hidden bg-green-700 touch-none select-none"
        style={{ aspectRatio: `${width}/${height}`, maxWidth: width }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <PitchMarkings />

        {positions.map((pos) => (
          <div
            key={pos.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: 'none' }}
            onPointerDown={(e) => handlePointerDown(e, pos.id)}
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(editingId === pos.id ? null : pos.id);
            }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-neutral-900 shadow-lg ring-2 ring-white/40">
                {pos.label}
              </div>
              {editingId === pos.id && (
                <div
                  className="absolute top-10 z-50 flex flex-col gap-1 rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    className="rounded border border-neutral-600 bg-neutral-800 px-1.5 py-1 text-xs text-white"
                    value={pos.position_code}
                    onChange={(e) => updatePosition(pos.id, 'position_code', e.target.value)}
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="flex gap-1 text-[10px] text-neutral-400">
                    <span>X:{pos.x.toFixed(0)}%</span>
                    <span>Y:{pos.y.toFixed(0)}%</span>
                  </div>
                  <button
                    className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-500"
                    onClick={() => deletePosition(pos.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/80"
          onClick={addPosition}
        >
          + Add Position
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>{positions.length} positions</span>
        <span className="text-neutral-500">Tap a position to edit · Drag to move</span>
      </div>
    </div>
  );
}

function PitchMarkings() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 140" preserveAspectRatio="none">
      <defs>
        <pattern id="editorMow" width="10" height="20" patternUnits="userSpaceOnUse">
          <rect width="10" height="20" fill="#1e6332" />
          <rect x="0" width="5" height="20" fill="#237039" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="140" fill="url(#editorMow)" />
      <g stroke="#F4EBDD" strokeWidth="0.4" fill="none" opacity="0.6">
        <rect x="3" y="3" width="94" height="134" rx="1" />
        <line x1="3" y1="70" x2="97" y2="70" />
        <circle cx="50" cy="70" r="10" />
        <circle cx="50" cy="70" r="0.8" fill="#F4EBDD" />
        <rect x="25" y="3" width="50" height="18" />
        <rect x="36" y="3" width="28" height="7" />
        <circle cx="50" cy="15" r="0.6" fill="#F4EBDD" />
        <rect x="25" y="119" width="50" height="18" />
        <rect x="36" y="130" width="28" height="7" />
        <circle cx="50" cy="125" r="0.6" fill="#F4EBDD" />
      </g>
    </svg>
  );
}
