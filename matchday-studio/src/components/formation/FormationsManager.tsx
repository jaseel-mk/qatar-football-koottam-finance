import { useState } from 'react';
import type { SavedFormation } from '@/lib/formation-types';
import type { FormationDraftPosition } from '@/lib/formation-types';
import { FormationEditor } from '@/components/formation/FormationEditor';

interface FormationsManagerProps {
  formations: SavedFormation[];
  onSave: (name: string, code: string, positions: FormationDraftPosition[]) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function FormationsManager({ formations, onSave, onDelete, onBack }: FormationsManagerProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingCode, setEditingCode] = useState('');
  const [draftPositions, setDraftPositions] = useState<FormationDraftPosition[]>([]);

  const startNew = () => {
    setEditingName('');
    setEditingCode('');
    setDraftPositions([]);
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!editingName.trim() || !editingCode.trim()) return;
    onSave(editingName, editingCode, draftPositions);
    setShowEditor(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Saved Formations</h2>
          <p className="text-sm text-neutral-400">Reusable formation templates with visual position coordinates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-800">
            Back
          </button>
          <button onClick={startNew}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-neutral-950 hover:bg-amber-400">
            + Add Formation
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="rounded-xl border border-amber-600/40 bg-neutral-900 p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-500">New Formation Editor</h3>
          <div className="grid gap-4 md:grid-cols-[300px_1fr]">
            <div className="space-y-3">
              <label>
                <span className="mb-1 block text-xs font-semibold text-neutral-400">Formation Name</span>
                <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)}
                  placeholder="e.g. 3-3-1 Attack"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-neutral-400">Formation Code</span>
                <input type="text" value={editingCode} onChange={(e) => setEditingCode(e.target.value)}
                  placeholder="e.g. 3-3-1"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
              </label>
              <div className="space-y-1 text-xs text-neutral-400">
                <p>Click + Add Position on the pitch.</p>
                <p>Drag positions to reposition.</p>
                <p>Tap a position to edit or delete it.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500">
                  Save Formation
                </button>
                <button onClick={() => setShowEditor(false)}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-700">
                  Cancel
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <FormationEditor positions={draftPositions} onChange={setDraftPositions} width={360} height={480} />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {formations.map((f) => (
          <div key={f.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{f.name}</h4>
                <p className="text-xs font-mono text-neutral-400">{f.code}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                f.is_active ? 'bg-green-900/50 text-green-300' : 'bg-neutral-800 text-neutral-500'
              }`}>
                {f.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 text-xs text-neutral-500">
              {(f.positions ?? []).length} positions
            </div>
            {/* Mini pitch preview */}
            <div className="mt-3 relative h-32 overflow-hidden rounded-lg bg-green-700">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 130" preserveAspectRatio="none">
                <rect x="0" y="0" width="100" height="130" fill="#1e6332" />
                <g stroke="#F4EBDD" strokeWidth="0.3" fill="none" opacity="0.4">
                  <rect x="3" y="3" width="94" height="124" rx="1" />
                  <line x1="3" y1="65" x2="97" y2="65" />
                  <circle cx="50" cy="65" r="8" />
                </g>
                {(f.positions ?? []).map((pos, i) => (
                  <g key={i}>
                    <circle cx={pos.x} cy={(pos.y / 100) * 130} r="4" fill="#F4EBDD" opacity="0.8" />
                    <text x={pos.x} y={(pos.y / 100) * 130 + 1.5} textAnchor="middle" fontSize="3" fontWeight="700" fill="#650D2B">
                      {pos.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <button onClick={() => onDelete(f.id)}
              className="mt-3 w-full rounded-lg bg-red-900/40 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-800/60">
              Delete Formation
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
