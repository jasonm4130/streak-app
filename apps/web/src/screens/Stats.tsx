// apps/web/src/screens/Stats.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { subDays } from 'date-fns';
import { db } from '../db';
import type { DayLog, Settings } from '../types';
import { today, parseISO, toISO } from '../lib/dates';
import { dayScore, adherenceBand } from '../lib/scoring';
import { weekFor } from '../lib/week';
import { WeightChart } from '../components/WeightChart';
import { Sparkline } from '../components/Sparkline';
import { HorizontalBar } from '../components/HorizontalBar';
import { WeeklyTally } from '../components/WeeklyTally';

const FIELD_KEYS: { key: keyof DayLog; label: string }[] = [
  { key: 'session', label: 'session' },
  { key: 'sleepHours', label: 'sleep' },
  { key: 'weightKg', label: 'weight' },
  { key: 'hydrationOk', label: 'hydrate' },
  { key: 'proteinGrams', label: 'protein' },
  { key: 'mobilityDone', label: 'mobility' },
  { key: 'readingDone', label: 'reading' },
];

export function Stats({ settings }: { settings: Settings }) {
  const days28 = useLiveQuery(async () => {
    const end = today();
    const start = toISO(subDays(parseISO(end), 27));
    return db.days.where('date').between(start, end, true, true).sortBy('date');
  }) ?? [];

  const allDays = useLiveQuery(() => db.days.orderBy('date').toArray()) ?? [];

  // Weight scatter + 7-day rolling avg over the last 60 days
  const weightWindow = allDays.filter((d) => d.weightKg !== undefined).slice(-60);
  const rolling = rollingAvg(weightWindow.map((d) => ({ date: d.date, kg: d.weightKg! })), 7);

  // 28-day adherence sparkline values (one per day, scored)
  const sparkValues = days28.map((d) => {
    const s = dayScore(d, settings);
    return s.hit / s.total;
  });

  // Per-field 28-day hit %
  const fieldStats = FIELD_KEYS.map(({ key, label }) => {
    const hits = days28.reduce((acc, d) => acc + (fieldHit(d, key, settings) ? 1 : 0), 0);
    const denom = days28.length || 1;
    return { label, value: hits / denom };
  });

  // Weekly strength tally — 15 weeks
  const weeks = aggregateStrengthPerWeek(allDays, settings);

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 480, margin: '0 auto' }}>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 data-testid="stats-section-weight" style={{ font: 'inherit', fontSize: 12, color: 'var(--fg-muted)', letterSpacing: 1, marginBottom: 'var(--space-2)' }}>
          WEIGHT — last 60 days
        </h2>
        <WeightChart
          points={weightWindow.map((d) => ({ date: d.date, kg: d.weightKg! }))}
          rollingAvg={rolling}
          height={120}
        />
      </section>

      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 data-testid="stats-section-adherence" style={{ font: 'inherit', fontSize: 12, color: 'var(--fg-muted)', letterSpacing: 1, marginBottom: 'var(--space-2)' }}>
          ADHERENCE — last 28 days
        </h2>
        <Sparkline values={sparkValues} height={48} bandFn={(v) => adherenceBand(v)} />
      </section>

      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 data-testid="stats-section-fields" style={{ font: 'inherit', fontSize: 12, color: 'var(--fg-muted)', letterSpacing: 1, marginBottom: 'var(--space-2)' }}>
          PER-FIELD HIT % — last 28 days
        </h2>
        {fieldStats.map((s) => (
          <HorizontalBar
            key={s.label}
            label={s.label}
            value={s.value}
            band={adherenceBand(s.value)}
            showPercent
          />
        ))}
      </section>

      <section>
        <h2 data-testid="stats-section-strength" style={{ font: 'inherit', fontSize: 12, color: 'var(--fg-muted)', letterSpacing: 1, marginBottom: 'var(--space-2)' }}>
          STRENGTH — sessions per week (target 2)
        </h2>
        <WeeklyTally weeks={weeks} target={2} />
      </section>
    </div>
  );
}

function rollingAvg(points: { date: string; kg: number }[], window: number) {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((a, p) => a + p.kg, 0) / slice.length;
    return { date: points[i].date, kg: avg };
  });
}

function fieldHit(d: DayLog, key: keyof DayLog, s: Settings): boolean {
  switch (key) {
    case 'session': return d.session === 'done' || d.session === 'modified';
    case 'sleepHours': return (d.sleepHours ?? 0) >= s.sleepFloorHours;
    case 'weightKg': return d.weightKg !== undefined;
    case 'hydrationOk': return !!d.hydrationOk;
    case 'proteinGrams': return (d.proteinGrams ?? 0) >= s.bodyWeightKg * s.proteinFloorPerKg;
    case 'mobilityDone': return !!d.mobilityDone;
    case 'readingDone': return !!d.readingDone;
    default: return false;
  }
}

function aggregateStrengthPerWeek(allDays: DayLog[], settings: Settings) {
  const m = parseISO(settings.marathonDate);
  const buckets = new Map<number, number>();
  for (const d of allDays) {
    if (!d.strengthDone) continue;
    const w = weekFor(parseISO(d.date), m);
    if (typeof w.weekNumber !== 'number') continue;
    buckets.set(w.weekNumber, (buckets.get(w.weekNumber) ?? 0) + 1);
  }
  const out: { weekNumber: number; sessions: number }[] = [];
  for (let i = 1; i <= 15; i++) {
    out.push({ weekNumber: i, sessions: buckets.get(i) ?? 0 });
  }
  return out;
}
