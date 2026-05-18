import type { DayLog, Settings } from '../types';
import { BAND_AMBER_THRESHOLD, BAND_GREEN_THRESHOLD } from './constants';

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

export function dayScore(d: DayLog, s: Settings): DayScore {
  const total: 6 | 7 = d.restDay ? 6 : 7;
  let hit = 0;
  for (const key of SCORABLE_FIELDS) {
    if (d.restDay && key === 'session') continue;
    if (fieldHit(d, key, s)) hit++;
  }
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
  if (value >= BAND_GREEN_THRESHOLD) return 'green';
  if (value >= BAND_AMBER_THRESHOLD) return 'amber';
  return 'red';
}
