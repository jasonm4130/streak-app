// apps/web/src/screens/Settings.tsx
import { useRef, useState } from 'react';
import { db } from '../db';
import type { Settings as SettingsT } from '../types';
import { exportAll, importAll, type StreakExport } from '../lib/export';
import { NumberInput } from '../components/NumberInput';
import { FieldRow } from '../components/FieldRow';

export function Settings({ settings }: { settings: SettingsT }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [wipeOnImport, setWipeOnImport] = useState(false);

  async function patch(partial: Partial<SettingsT>) {
    await db.settings.put({ ...settings, ...partial });
  }

  async function doExport() {
    const dump = await exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streak-export-${dump.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const dump = JSON.parse(text) as StreakExport;
    await importAll(dump, { wipe: wipeOnImport });
    e.target.value = '';
    alert(`imported ${dump.days.length} days, ${dump.photos.length} photos`);
  }

  async function wipeAll() {
    if (!confirm('really wipe ALL data? this cannot be undone.')) return;
    await db.days.clear();
    await db.photos.clear();
    await db.settings.clear();
  }

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 480, margin: '0 auto' }}>
      <FieldRow label="body weight" status="pending">
        <NumberInput value={settings.bodyWeightKg} onChange={(n) => n && patch({ bodyWeightKg: n })} step={0.1} min={20} max={300} suffix="kg" />
      </FieldRow>

      <FieldRow label="marathon date" status="pending">
        <input
          type="date"
          value={settings.marathonDate}
          onChange={(e) => patch({ marathonDate: e.target.value })}
          style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 'var(--space-2) var(--space-3)', color: 'var(--fg)', minHeight: 'var(--tap)' }}
        />
      </FieldRow>

      <FieldRow label="sleep floor" status="pending">
        <NumberInput value={settings.sleepFloorHours} onChange={(n) => n && patch({ sleepFloorHours: n })} step={0.25} min={4} max={12} suffix="h" />
      </FieldRow>

      <FieldRow label="protein floor" status="pending">
        <NumberInput value={settings.proteinFloorPerKg} onChange={(n) => n && patch({ proteinFloorPerKg: n })} step={0.1} min={0.5} max={3} suffix="g/kg" />
      </FieldRow>

      <FieldRow label="mobility floor" status="pending">
        <NumberInput value={settings.mobilityFloorMin} onChange={(n) => n && patch({ mobilityFloorMin: n })} step={1} min={0} max={60} suffix="min" />
      </FieldRow>

      <FieldRow label="reading floor" status="pending">
        <NumberInput value={settings.readingFloorPages} onChange={(n) => n && patch({ readingFloorPages: n })} step={1} min={0} max={100} suffix="pg" />
      </FieldRow>

      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 'var(--space-5) 0' }} />

      <button
        onClick={doExport}
        style={{ display: 'block', width: '100%', padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--green)', marginBottom: 'var(--space-3)' }}
      >
        export JSON ↓
      </button>

      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <input type="checkbox" checked={wipeOnImport} onChange={(e) => setWipeOnImport(e.target.checked)} />
        wipe before import (destructive)
      </label>
      <input ref={fileRef} type="file" accept="application/json" onChange={onFile} style={{ marginBottom: 'var(--space-5)' }} />

      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 'var(--space-5) 0' }} />

      <button
        onClick={wipeAll}
        style={{ display: 'block', width: '100%', padding: 'var(--space-3)', border: '1px solid var(--red)', borderRadius: 'var(--r-md)', color: 'var(--red)' }}
      >
        wipe all data
      </button>
    </div>
  );
}
