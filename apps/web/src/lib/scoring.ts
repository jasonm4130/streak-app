import type { DayLog, Settings } from '../types';
import { BAND_AMBER_THRESHOLD, BAND_GREEN_THRESHOLD } from './constants';

/** Fields that count toward the daily score. `strengthDone` is tracked but not scored. */
export type ScorableField =
  | 'session'
  | 'sleepHours'
  | 'weightKg'
  | 'hydrationOk'
  | 'proteinGrams'
  | 'mobilityDone'
  | 'readingDone';

const SCORABLE_FIELDS: readonly ScorableField[] = [
  'session',
  'sleepHours',
  'weightKg',
  'hydrationOk',
  'proteinGrams',
  'mobilityDone',
  'readingDone',
];

/**
 * Single source of truth for "is this field hit for this day?". All UI and
 * scoring paths route through here so the green/grey dots and adherence
 * percentages can never disagree.
 */
export function fieldHit(d: DayLog, key: ScorableField, s: Settings): boolean {
  switch (key) {
    case 'session':       return d.session === 'done' || d.session === 'modified';
    case 'sleepHours':    return (d.sleepHours ?? 0) >= s.sleepFloorHours;
    case 'weightKg':      return d.weightKg !== undefined;
    case 'hydrationOk':   return !!d.hydrationOk;
    case 'proteinGrams':  return (d.proteinGrams ?? 0) >= s.bodyWeightKg * s.proteinFloorPerKg;
    case 'mobilityDone':  return !!d.mobilityDone;
    case 'readingDone':   return !!d.readingDone;
  }
}

interface DayScore {
  hit: number;
  total: 6 | 7;
}

/**
 * Score a day as `{hit, total}`. `total` is 7 normally; on a rest day it
 * rebases to 6 by dropping the `session` field, so a rest day with everything
 * else hit still scores 100%.
 */
export function dayScore(d: DayLog, s: Settings): DayScore {
  const total: 6 | 7 = d.restDay ? 6 : 7;
  let hit = 0;
  for (const key of SCORABLE_FIELDS) {
    if (d.restDay && key === 'session') continue;
    if (fieldHit(d, key, s)) hit++;
  }
  return { hit, total };
}

/**
 * Rolling adherence as a 0..1 ratio: sum of hits divided by sum of totals
 * across the input days. Uses summed totals (not mean-of-means) so rest days
 * weight correctly.
 */
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

/** Adherence band tier driven off `BAND_*_THRESHOLD` constants. */
export type AdherenceBand = 'green' | 'amber' | 'red';

/** Map a 0..1 adherence value to a band. See `BAND_GREEN_THRESHOLD` / `BAND_AMBER_THRESHOLD`. */
export function adherenceBand(value: number): AdherenceBand {
  if (value >= BAND_GREEN_THRESHOLD) return 'green';
  if (value >= BAND_AMBER_THRESHOLD) return 'amber';
  return 'red';
}
