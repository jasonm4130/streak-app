import type { DayLog, Settings } from '../types';

interface DayScore {
  hit: number;
  total: 6 | 7;
}

export function dayScore(d: DayLog, s: Settings): DayScore {
  const total: 6 | 7 = d.restDay ? 6 : 7;
  let hit = 0;

  if (!d.restDay && (d.session === 'done' || d.session === 'modified')) hit++;
  if (d.sleepHours !== undefined && d.sleepHours >= s.sleepFloorHours) hit++;
  if (d.weightKg !== undefined) hit++;
  if (d.hydrationOk) hit++;
  if (
    d.proteinGrams !== undefined &&
    d.proteinGrams >= s.proteinFloorPerKg * s.bodyWeightKg
  ) {
    hit++;
  }
  if (d.mobilityDone) hit++;
  if (d.readingDone) hit++;

  return { hit, total };
}

export function adherence(days: DayLog[], s: Settings): number {
  if (days.length === 0) return 0;
  let hit = 0;
  let total = 0;
  for (const d of days) {
    const ds = dayScore(d, s);
    hit += ds.hit;
    total += ds.total;
  }
  return total === 0 ? 0 : hit / total;
}

export type AdherenceBand = 'green' | 'amber' | 'red';

export function adherenceBand(value: number): AdherenceBand {
  if (value >= 0.85) return 'green';
  if (value >= 0.7) return 'amber';
  return 'red';
}
