// apps/web/src/screens/Today.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { DayLog, Settings, SessionStatus } from '../types';
import { today, formatDisplay, parseISO, toISO } from '../lib/dates';
import { weekFor } from '../lib/week';
import { dayScore, adherence, adherenceBand } from '../lib/scoring';
import { downsize } from '../lib/photos';
import { ulid } from 'ulid';
import { AdherencePill } from '../components/AdherencePill';
import { FieldRow } from '../components/FieldRow';
import { ButtonGroup } from '../components/ButtonGroup';
import { NumberInput } from '../components/NumberInput';
import { ToggleRow } from '../components/ToggleRow';
import { NoteInput } from '../components/NoteInput';
import { subDays } from 'date-fns';
import { ADHERENCE_WINDOW_DAYS } from '../lib/constants';

const SESSION_OPTIONS = [
  { value: 'done' as const, label: 'done' },
  { value: 'modified' as const, label: 'mod' },
  { value: 'skipped' as const, label: 'skip' },
];

export function Today({ settings }: { settings: Settings }) {
  const date = today();
  const day = useLiveQuery(() => db.days.get(date), [date]) ?? { date, updatedAt: 0 };

  // Rolling adherence window ending today, inclusive
  const days28 = useLiveQuery(
    async () => {
      const start = subDays(parseISO(date), ADHERENCE_WINDOW_DAYS - 1);
      return db.days
        .where('date')
        .between(toISO(start), date, true, true)
        .toArray();
    },
    [date],
  ) ?? [];

  const week = weekFor(parseISO(date), parseISO(settings.marathonDate));
  const a28 = adherence(days28, settings);
  const band = adherenceBand(a28);
  const score = dayScore(day, settings);

  async function patch(partial: Partial<DayLog>) {
    const next: DayLog = { ...day, ...partial, date, updatedAt: Date.now() };
    await db.days.put(next);
  }

  function weekLabel() {
    if (week.weekNumber === 'pre') return 'Pre-week';
    if (week.weekNumber === 'post') return `Race complete · day +${week.dayOfWeek}`;
    return `Week ${week.weekNumber} · day ${week.dayOfWeek}/7`;
  }

  async function setPhoto(file: File) {
    const downsized = await downsize(file);
    const id = ulid();
    await db.photos.put({ id, blob: downsized, takenAt: date });
    await patch({ photoBlobId: id });
  }

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 480, margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{formatDisplay(date)}</div>
        <div style={{ color: 'var(--fg-muted)', fontSize: 12, marginBottom: 'var(--space-3)' }}>
          {weekLabel()} · score {score.hit}/{score.total}
        </div>
        <AdherencePill value={a28} band={band} label={`${ADHERENCE_WINDOW_DAYS}d`} />
      </header>

      <ToggleRow
        label="rest day"
        value={!!day.restDay}
        onChange={(v) => patch({ restDay: v })}
      />

      {!day.restDay && (
        <FieldRow label="session" status={hitStatus(day.session === 'done' || day.session === 'modified')}>
          <ButtonGroup<SessionStatus>
            value={day.session}
            options={SESSION_OPTIONS}
            onChange={(v) => patch({ session: v })}
          />
        </FieldRow>
      )}

      <FieldRow
        label={`sleep ≥${settings.sleepFloorHours}h`}
        status={hitStatus((day.sleepHours ?? 0) >= settings.sleepFloorHours)}
      >
        <NumberInput
          value={day.sleepHours}
          onChange={(n) => patch({ sleepHours: n })}
          step={0.25}
          min={0}
          max={16}
          suffix="h"
          data-testid="today-sleep"
        />
      </FieldRow>

      <FieldRow label="weight" status={hitStatus(day.weightKg !== undefined)}>
        <NumberInput
          value={day.weightKg}
          onChange={(n) => patch({ weightKg: n })}
          step={0.1}
          min={20}
          max={300}
          suffix="kg"
          data-testid="today-weight"
        />
      </FieldRow>

      <FieldRow label="hydration ✓ pale" status={hitStatus(!!day.hydrationOk)}>
        <ToggleRow value={!!day.hydrationOk} onChange={(v) => patch({ hydrationOk: v })} data-testid="today-hydration" />
      </FieldRow>

      <FieldRow
        label={`protein ≥${Math.round(settings.bodyWeightKg * settings.proteinFloorPerKg)}g`}
        status={hitStatus(
          (day.proteinGrams ?? 0) >= settings.bodyWeightKg * settings.proteinFloorPerKg,
        )}
      >
        <NumberInput
          value={day.proteinGrams}
          onChange={(n) => patch({ proteinGrams: n })}
          step={1}
          min={0}
          max={500}
          suffix="g"
          data-testid="today-protein"
        />
      </FieldRow>

      <FieldRow label="mobility 5min" status={hitStatus(!!day.mobilityDone)}>
        <ToggleRow value={!!day.mobilityDone} onChange={(v) => patch({ mobilityDone: v })} data-testid="today-mobility" />
      </FieldRow>

      <FieldRow label="reading 10pg" status={hitStatus(!!day.readingDone)}>
        <ToggleRow value={!!day.readingDone} onChange={(v) => patch({ readingDone: v })} data-testid="today-reading" />
      </FieldRow>

      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 'var(--space-5) 0' }} />

      <FieldRow label="strength (weekly 2×)" status={day.strengthDone ? 'hit' : 'pending'}>
        <ToggleRow value={!!day.strengthDone} onChange={(v) => patch({ strengthDone: v })} />
      </FieldRow>
      {day.strengthDone && (
        <FieldRow label="strength note" status="pending">
          <NoteInput
            value={day.strengthNote}
            onChange={(v) => patch({ strengthNote: v })}
            placeholder="squat 5x5 @ ..."
          />
        </FieldRow>
      )}

      <FieldRow label="weekly photo" status={day.photoBlobId ? 'hit' : 'pending'}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void setPhoto(f);
          }}
        />
      </FieldRow>
    </div>
  );
}

function hitStatus(condition: boolean): 'hit' | 'miss' | 'pending' {
  return condition ? 'hit' : 'pending';
}
