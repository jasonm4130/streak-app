// apps/web/src/screens/Stats.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { subDays } from 'date-fns';
import { db } from '../db';
import type { DayLog, Settings } from '../types';
import { today, parseISO, toISO } from '../lib/dates';
import type { ScorableField } from '../lib/scoring';
import { dayScore, adherenceBand, fieldHit } from '../lib/scoring';
import { weekFor } from '../lib/week';
import { WeightChart } from '../components/WeightChart';
import { Sparkline } from '../components/Sparkline';
import { HorizontalBar } from '../components/HorizontalBar';
import { WeeklyTally } from '../components/WeeklyTally';
import { SectionHeading } from '../components/SectionHeading';
import {
  ADHERENCE_WINDOW_DAYS,
  STRENGTH_TARGET_PER_WEEK,
  TOTAL_WEEKS,
  WEIGHT_ROLLING_AVG_DAYS,
  WEIGHT_WINDOW_DAYS,
} from '../lib/constants';
import styles from './Stats.module.css';

const FIELD_KEYS: { key: ScorableField; label: string }[] = [
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
    const start = toISO(subDays(parseISO(end), ADHERENCE_WINDOW_DAYS - 1));
    return db.days.where('date').between(start, end, true, true).sortBy('date');
  }) ?? [];

  const allDays = useLiveQuery(() => db.days.orderBy('date').toArray()) ?? [];

  // Weight scatter + rolling avg over the recent window
  const weightWindow = allDays.filter((d) => d.weightKg !== undefined).slice(-WEIGHT_WINDOW_DAYS);
  const rolling = rollingAvg(
    weightWindow.map((d) => ({ date: d.date, kg: d.weightKg! })),
    WEIGHT_ROLLING_AVG_DAYS,
  );

  // Adherence sparkline values (one per day, scored)
  const sparkValues = days28.map((d) => {
    const s = dayScore(d, settings);
    return s.hit / s.total;
  });

  // Per-field hit % over the adherence window
  const fieldStats = FIELD_KEYS.map(({ key, label }) => {
    const hits = days28.reduce((acc, d) => acc + (fieldHit(d, key, settings) ? 1 : 0), 0);
    const denom = days28.length || 1;
    return { label, value: hits / denom };
  });

  // Weekly strength tally — full prep block
  const weeks = aggregateStrengthPerWeek(allDays, settings);

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <SectionHeading data-testid="stats-section-weight">
          WEIGHT — last {WEIGHT_WINDOW_DAYS} days
        </SectionHeading>
        <WeightChart
          points={weightWindow.map((d) => ({ date: d.date, kg: d.weightKg! }))}
          rollingAvg={rolling}
          height={120}
        />
      </section>

      <section className={styles.section}>
        <SectionHeading data-testid="stats-section-adherence">
          ADHERENCE — last {ADHERENCE_WINDOW_DAYS} days
        </SectionHeading>
        <Sparkline values={sparkValues} height={48} bandFn={(v) => adherenceBand(v)} />
      </section>

      <section className={styles.section}>
        <SectionHeading data-testid="stats-section-fields">
          PER-FIELD HIT % — last {ADHERENCE_WINDOW_DAYS} days
        </SectionHeading>
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
        <SectionHeading data-testid="stats-section-strength">
          STRENGTH — sessions per week (target {STRENGTH_TARGET_PER_WEEK})
        </SectionHeading>
        <WeeklyTally weeks={weeks} target={STRENGTH_TARGET_PER_WEEK} />
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
  for (let i = 1; i <= TOTAL_WEEKS; i++) {
    out.push({ weekNumber: i, sessions: buckets.get(i) ?? 0 });
  }
  return out;
}
