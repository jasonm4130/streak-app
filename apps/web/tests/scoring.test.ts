import { describe, expect, it } from 'vitest';
import { dayScore, adherence, adherenceBand, fieldHit } from '../src/lib/scoring';
import type { DayLog, Settings } from '../src/types';

const settings: Settings = {
  id: 'singleton',
  bodyWeightKg: 100,
  marathonDate: '2026-08-30',
  proteinFloorPerKg: 1.6,
  sleepFloorHours: 7,
};

function emptyDay(date: string): DayLog {
  return { date, updatedAt: 0 };
}

function fullDay(date: string): DayLog {
  return {
    date,
    session: 'done',
    sleepHours: 8,
    weightKg: 99.5,
    hydrationOk: true,
    proteinGrams: 180,
    mobilityDone: true,
    readingDone: true,
    updatedAt: 1,
  };
}

describe('dayScore', () => {
  it('empty day = 0 / 7', () => {
    const r = dayScore(emptyDay('2026-05-18'), settings);
    expect(r).toEqual({ hit: 0, total: 7 });
  });

  it('all fields hit = 7 / 7', () => {
    expect(dayScore(fullDay('2026-05-18'), settings)).toEqual({ hit: 7, total: 7 });
  });

  it('modified session counts as session-hit', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), session: 'modified' };
    expect(dayScore(d, settings).hit).toBe(1);
  });

  it('skipped session does not count as hit', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), session: 'skipped' };
    expect(dayScore(d, settings).hit).toBe(0);
  });

  it('sleep below floor does not count', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), sleepHours: 6.5 };
    expect(dayScore(d, settings).hit).toBe(0);
  });

  it('sleep at floor counts', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), sleepHours: 7 };
    expect(dayScore(d, settings).hit).toBe(1);
  });

  it('weightKg logged counts regardless of value', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), weightKg: 80 };
    expect(dayScore(d, settings).hit).toBe(1);
  });

  it('protein below floor (1.6 * 100 = 160) does not count', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), proteinGrams: 159 };
    expect(dayScore(d, settings).hit).toBe(0);
  });

  it('protein at floor counts', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), proteinGrams: 160 };
    expect(dayScore(d, settings).hit).toBe(1);
  });

  it('rest day: total is /6 and session ignored', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), restDay: true, sleepHours: 8 };
    expect(dayScore(d, settings)).toEqual({ hit: 1, total: 6 });
  });

  it('rest day with session=done still does not count session', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), restDay: true, session: 'done' };
    expect(dayScore(d, settings)).toEqual({ hit: 0, total: 6 });
  });
});

describe('adherence', () => {
  it('empty list = 0', () => {
    expect(adherence([], settings)).toBe(0);
  });

  it('one full day = 1', () => {
    expect(adherence([fullDay('2026-05-18')], settings)).toBe(1);
  });

  it('one empty day = 0', () => {
    expect(adherence([emptyDay('2026-05-18')], settings)).toBe(0);
  });

  it('full + empty = 7/14 = 0.5', () => {
    expect(adherence([fullDay('2026-05-18'), emptyDay('2026-05-19')], settings)).toBe(0.5);
  });

  it('rest day with all 6 hit + empty = 6/13', () => {
    const rest: DayLog = {
      ...emptyDay('2026-05-18'),
      restDay: true,
      sleepHours: 8,
      weightKg: 99,
      hydrationOk: true,
      proteinGrams: 180,
      mobilityDone: true,
      readingDone: true,
    };
    expect(adherence([rest, emptyDay('2026-05-19')], settings)).toBeCloseTo(6 / 13, 4);
  });
});

describe('fieldHit', () => {
  it('session: done is a hit', () => {
    const d: DayLog = { ...emptyDay('2026-05-18'), session: 'done' };
    expect(fieldHit(d, 'session', settings)).toBe(true);
  });

  it('session: modified is a hit; skipped/undefined is a miss', () => {
    expect(fieldHit({ ...emptyDay('2026-05-18'), session: 'modified' }, 'session', settings)).toBe(true);
    expect(fieldHit({ ...emptyDay('2026-05-18'), session: 'skipped' }, 'session', settings)).toBe(false);
    expect(fieldHit(emptyDay('2026-05-18'), 'session', settings)).toBe(false);
  });

  it('sleepHours: at floor hits, below misses', () => {
    expect(fieldHit({ ...emptyDay('2026-05-18'), sleepHours: 7 }, 'sleepHours', settings)).toBe(true);
    expect(fieldHit({ ...emptyDay('2026-05-18'), sleepHours: 6.5 }, 'sleepHours', settings)).toBe(false);
    expect(fieldHit(emptyDay('2026-05-18'), 'sleepHours', settings)).toBe(false);
  });

  it('weightKg: any logged value hits; undefined misses', () => {
    expect(fieldHit({ ...emptyDay('2026-05-18'), weightKg: 80 }, 'weightKg', settings)).toBe(true);
    expect(fieldHit({ ...emptyDay('2026-05-18'), weightKg: 0 }, 'weightKg', settings)).toBe(true);
    expect(fieldHit(emptyDay('2026-05-18'), 'weightKg', settings)).toBe(false);
  });

  it('hydrationOk: truthy hits, falsy misses', () => {
    expect(fieldHit({ ...emptyDay('2026-05-18'), hydrationOk: true }, 'hydrationOk', settings)).toBe(true);
    expect(fieldHit({ ...emptyDay('2026-05-18'), hydrationOk: false }, 'hydrationOk', settings)).toBe(false);
    expect(fieldHit(emptyDay('2026-05-18'), 'hydrationOk', settings)).toBe(false);
  });

  it('proteinGrams: scales with bodyWeightKg * proteinFloorPerKg (100kg * 1.6 = 160g floor)', () => {
    // 159 misses, 160 hits at default 100kg body weight
    expect(fieldHit({ ...emptyDay('2026-05-18'), proteinGrams: 159 }, 'proteinGrams', settings)).toBe(false);
    expect(fieldHit({ ...emptyDay('2026-05-18'), proteinGrams: 160 }, 'proteinGrams', settings)).toBe(true);
    expect(fieldHit(emptyDay('2026-05-18'), 'proteinGrams', settings)).toBe(false);
    // Floor rescales with body weight (80kg * 1.6 = 128g)
    const lighter: Settings = { ...settings, bodyWeightKg: 80 };
    expect(fieldHit({ ...emptyDay('2026-05-18'), proteinGrams: 127 }, 'proteinGrams', lighter)).toBe(false);
    expect(fieldHit({ ...emptyDay('2026-05-18'), proteinGrams: 128 }, 'proteinGrams', lighter)).toBe(true);
  });

  it('mobilityDone: truthy hits, falsy misses', () => {
    expect(fieldHit({ ...emptyDay('2026-05-18'), mobilityDone: true }, 'mobilityDone', settings)).toBe(true);
    expect(fieldHit(emptyDay('2026-05-18'), 'mobilityDone', settings)).toBe(false);
  });

  it('readingDone: truthy hits, falsy misses', () => {
    expect(fieldHit({ ...emptyDay('2026-05-18'), readingDone: true }, 'readingDone', settings)).toBe(true);
    expect(fieldHit(emptyDay('2026-05-18'), 'readingDone', settings)).toBe(false);
  });
});

describe('adherenceBand', () => {
  it('≥0.85 = green', () => {
    expect(adherenceBand(0.85)).toBe('green');
    expect(adherenceBand(0.99)).toBe('green');
  });
  it('0.70–0.85 = amber', () => {
    expect(adherenceBand(0.7)).toBe('amber');
    expect(adherenceBand(0.84999)).toBe('amber');
  });
  it('<0.70 = red', () => {
    expect(adherenceBand(0.69)).toBe('red');
    expect(adherenceBand(0)).toBe('red');
  });
});
