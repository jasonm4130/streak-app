// apps/web/src/screens/Settings.tsx
import { useRef, useState } from 'react';
import { db } from '../db';
import type { Settings as SettingsT } from '../types';
import { exportAll, importAll, type StreakExport } from '../lib/export';
import { NumberInput } from '../components/NumberInput';
import { FieldRow } from '../components/FieldRow';
import styles from './Settings.module.css';

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
    <div className={styles.page}>
      <FieldRow label="body weight" status="pending">
        <NumberInput value={settings.bodyWeightKg} onChange={(n) => n !== undefined && patch({ bodyWeightKg: n })} step={0.1} min={20} max={300} suffix="kg" />
      </FieldRow>

      <FieldRow label="marathon date" status="pending">
        <input
          type="date"
          value={settings.marathonDate}
          onChange={(e) => patch({ marathonDate: e.target.value })}
          className={styles.dateInput}
        />
      </FieldRow>

      <FieldRow label="sleep floor" status="pending">
        <NumberInput value={settings.sleepFloorHours} onChange={(n) => n !== undefined && patch({ sleepFloorHours: n })} step={0.25} min={4} max={12} suffix="h" />
      </FieldRow>

      <FieldRow label="protein floor" status="pending">
        <NumberInput value={settings.proteinFloorPerKg} onChange={(n) => n !== undefined && patch({ proteinFloorPerKg: n })} step={0.1} min={0.5} max={3} suffix="g/kg" />
      </FieldRow>

      <hr className={styles.separator} />

      <button
        onClick={doExport}
        data-testid="settings-export"
        className={styles.exportButton}
      >
        export JSON ↓
      </button>

      <label className={styles.wipeBeforeImport}>
        <input type="checkbox" checked={wipeOnImport} onChange={(e) => setWipeOnImport(e.target.checked)} />
        wipe before import (destructive)
      </label>
      <input ref={fileRef} type="file" accept="application/json" onChange={onFile} className={styles.fileInput} />

      <hr className={styles.separator} />

      <button
        onClick={wipeAll}
        data-testid="settings-wipe"
        className={styles.wipeButton}
      >
        wipe all data
      </button>
    </div>
  );
}
