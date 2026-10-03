import { useState } from 'react';
import type { SavedFormation, Side, MatchStatus } from '@/lib/formation-types';
import { POSTER_THEMES } from '@/lib/formation-types';

export interface MatchFormData {
  match_number: number;
  match_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  title: string;
  description: string;
  poster_theme: string;
  status: MatchStatus;
  team_a_name: string;
  team_a_primary: string;
  team_a_secondary: string;
  team_a_text: string;
  team_a_gk: string;
  team_a_formation_id: string;
  team_b_name: string;
  team_b_primary: string;
  team_b_secondary: string;
  team_b_text: string;
  team_b_gk: string;
  team_b_formation_id: string;
}

interface MatchFormProps {
  initial?: Partial<MatchFormData>;
  formations: SavedFormation[];
  onSubmit: (data: MatchFormData) => void;
  onCancel: () => void;
}

const defaults: MatchFormData = {
  match_number: 1,
  match_date: new Date().toISOString().slice(0, 10),
  start_time: '8:00 PM',
  end_time: '9:00 PM',
  venue: '',
  title: '',
  description: '',
  poster_theme: 'auto',
  status: 'draft',
  team_a_name: 'Team A',
  team_a_primary: '#1746D1',
  team_a_secondary: '#F7F5EE',
  team_a_text: '#FFFFFF',
  team_a_gk: '#141820',
  team_a_formation_id: '',
  team_b_name: 'Team B',
  team_b_primary: '#F7F5EE',
  team_b_secondary: '#1746D1',
  team_b_text: '#141820',
  team_b_gk: '#141820',
  team_b_formation_id: '',
};

export function MatchForm({ initial, formations, onSubmit, onCancel }: MatchFormProps) {
  const [data, setData] = useState<MatchFormData>({ ...defaults, ...initial });

  const set = <K extends keyof MatchFormData>(key: K, val: MatchFormData[K]) =>
    setData((d) => ({ ...d, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const activeFormations = formations.filter((f) => f.is_active);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Match Information">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Match Number">
            <input type="number" min={1} value={data.match_number}
              onChange={(e) => set('match_number', parseInt(e.target.value) || 1)}
              className={inputCls} />
          </Field>
          <Field label="Date">
            <input type="date" value={data.match_date}
              onChange={(e) => set('match_date', e.target.value)}
              className={inputCls} />
          </Field>
          <Field label="Start Time">
            <input type="text" value={data.start_time}
              onChange={(e) => set('start_time', e.target.value)}
              className={inputCls} placeholder="8:00 PM" />
          </Field>
          <Field label="End Time">
            <input type="text" value={data.end_time}
              onChange={(e) => set('end_time', e.target.value)}
              className={inputCls} placeholder="9:00 PM" />
          </Field>
          <Field label="Venue" full>
            <input type="text" value={data.venue}
              onChange={(e) => set('venue', e.target.value)}
              className={inputCls} placeholder="Abu Hamour" />
          </Field>
          <Field label="Match Title" full>
            <input type="text" value={data.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputCls} placeholder="Friday Night Football" />
          </Field>
          <Field label="Description (optional)" full>
            <textarea value={data.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${inputCls} min-h-[60px]`} />
          </Field>
          <Field label="Poster Theme">
            <select value={data.poster_theme}
              onChange={(e) => set('poster_theme', e.target.value)}
              className={inputCls}>
              {POSTER_THEMES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={data.status}
              onChange={(e) => set('status', e.target.value as MatchStatus)}
              className={inputCls}>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="confirmed">Confirmed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <TeamConfig
          label="Team A"
          name={data.team_a_name}
          onName={(v) => set('team_a_name', v)}
          primary={data.team_a_primary}
          onPrimary={(v) => set('team_a_primary', v)}
          secondary={data.team_a_secondary}
          onSecondary={(v) => set('team_a_secondary', v)}
          text={data.team_a_text}
          onText={(v) => set('team_a_text', v)}
          gk={data.team_a_gk}
          onGk={(v) => set('team_a_gk', v)}
          formationId={data.team_a_formation_id}
          onFormation={(v) => set('team_a_formation_id', v)}
          formations={activeFormations}
        />
        <TeamConfig
          label="Team B"
          name={data.team_b_name}
          onName={(v) => set('team_b_name', v)}
          primary={data.team_b_primary}
          onPrimary={(v) => set('team_b_primary', v)}
          secondary={data.team_b_secondary}
          onSecondary={(v) => set('team_b_secondary', v)}
          text={data.team_b_text}
          onText={(v) => set('team_b_text', v)}
          gk={data.team_b_gk}
          onGk={(v) => set('team_b_gk', v)}
          formationId={data.team_b_formation_id}
          onFormation={(v) => set('team_b_formation_id', v)}
          formations={activeFormations}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white">
          Cancel
        </button>
        <button type="submit"
          className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-bold text-neutral-950 hover:bg-amber-400">
          Save Match
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-500">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? 'col-span-2' : ''}>
      <span className="mb-1 block text-xs font-semibold text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

interface TeamConfigProps {
  label: string;
  name: string;
  onName: (v: string) => void;
  primary: string;
  onPrimary: (v: string) => void;
  secondary: string;
  onSecondary: (v: string) => void;
  text: string;
  onText: (v: string) => void;
  gk: string;
  onGk: (v: string) => void;
  formationId: string;
  onFormation: (v: string) => void;
  formations: SavedFormation[];
}

function TeamConfig(props: TeamConfigProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-500">{props.label}</h3>
      <div className="space-y-3">
        <label>
          <span className="mb-1 block text-xs font-semibold text-neutral-400">Team Name</span>
          <input type="text" value={props.name} onChange={(e) => props.onName(e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-neutral-400">Formation</span>
          <select value={props.formationId} onChange={(e) => props.onFormation(e.target.value)} className={inputCls}>
            <option value="">— Select Formation —</option>
            {props.formations.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Primary" value={props.primary} onChange={props.onPrimary} />
          <ColorField label="Secondary" value={props.secondary} onChange={props.onSecondary} />
          <ColorField label="Text" value={props.text} onChange={props.onText} />
          <ColorField label="Goalkeeper" value={props.gk} onChange={props.onGk} />
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold text-neutral-400">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs font-mono text-white focus:outline-none" />
      </div>
    </label>
  );
}
