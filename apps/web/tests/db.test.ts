import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/db';
import type { DayLog } from '../src/types';

describe('db round-trip', () => {
  beforeEach(async () => {
    await db.days.clear();
    await db.photos.clear();
    await db.settings.clear();
  });

  afterEach(async () => {
    await db.days.clear();
    await db.photos.clear();
    await db.settings.clear();
  });

  it('stores and retrieves a day log by date pk', async () => {
    const day: DayLog = {
      date: '2026-05-18',
      session: 'done',
      sleepHours: 7.5,
      updatedAt: 1,
    };
    await db.days.put(day);
    const got = await db.days.get('2026-05-18');
    expect(got?.session).toBe('done');
    expect(got?.sleepHours).toBe(7.5);
  });

  it('overwrites on put with same pk', async () => {
    await db.days.put({ date: '2026-05-18', sleepHours: 6, updatedAt: 1 });
    await db.days.put({ date: '2026-05-18', sleepHours: 8, updatedAt: 2 });
    const got = await db.days.get('2026-05-18');
    expect(got?.sleepHours).toBe(8);
  });

  it('updatedAt index supports ordering', async () => {
    await db.days.put({ date: '2026-05-18', updatedAt: 100 });
    await db.days.put({ date: '2026-05-19', updatedAt: 200 });
    const ordered = await db.days.orderBy('updatedAt').toArray();
    expect(ordered.map((d) => d.date)).toEqual(['2026-05-18', '2026-05-19']);
  });

  it('settings singleton put/get', async () => {
    await db.settings.put({
      id: 'singleton',
      bodyWeightKg: 100,
      marathonDate: '2026-08-30',
      proteinFloorPerKg: 1.6,
      sleepFloorHours: 7,
    });
    const s = await db.settings.get('singleton');
    expect(s?.bodyWeightKg).toBe(100);
  });
});
