import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/db';
import { exportAll, importAll, type StreakExport } from '../src/lib/export';

const baseSettings = {
  id: 'singleton' as const,
  bodyWeightKg: 100,
  marathonDate: '2026-08-30',
  proteinFloorPerKg: 1.6,
  sleepFloorHours: 7,
  mobilityFloorMin: 5,
  readingFloorPages: 10,
};

describe('export / import', () => {
  beforeEach(async () => {
    await db.days.clear();
    await db.photos.clear();
    await db.settings.clear();
  });

  it('export captures settings + days', async () => {
    await db.settings.put(baseSettings);
    await db.days.put({ date: '2026-05-18', session: 'done', updatedAt: 1 });
    const dump = await exportAll();
    expect(dump.schema).toBe(1);
    expect(dump.settings?.bodyWeightKg).toBe(100);
    expect(dump.days).toHaveLength(1);
    expect(dump.days[0].date).toBe('2026-05-18');
  });

  it('import (merge) overwrites with newer updatedAt', async () => {
    await db.days.put({ date: '2026-05-18', sleepHours: 6, updatedAt: 1 });
    const incoming: StreakExport = {
      schema: 1,
      exportedAt: '2026-05-18T00:00:00Z',
      settings: null,
      days: [{ date: '2026-05-18', sleepHours: 8, updatedAt: 2 }],
      photos: [],
    };
    await importAll(incoming, { wipe: false });
    const got = await db.days.get('2026-05-18');
    expect(got?.sleepHours).toBe(8);
  });

  it('import (merge) preserves local row when local updatedAt is newer', async () => {
    await db.days.put({ date: '2026-05-18', sleepHours: 8, updatedAt: 100 });
    const incoming: StreakExport = {
      schema: 1,
      exportedAt: '2026-05-18T00:00:00Z',
      settings: null,
      days: [{ date: '2026-05-18', sleepHours: 6, updatedAt: 1 }],
      photos: [],
    };
    await importAll(incoming, { wipe: false });
    const got = await db.days.get('2026-05-18');
    expect(got?.sleepHours).toBe(8);
  });

  it('import (wipe) replaces all data', async () => {
    await db.days.put({ date: '2026-05-18', sleepHours: 8, updatedAt: 100 });
    const incoming: StreakExport = {
      schema: 1,
      exportedAt: '2026-05-18T00:00:00Z',
      settings: baseSettings,
      days: [{ date: '2026-05-19', sleepHours: 7, updatedAt: 50 }],
      photos: [],
    };
    await importAll(incoming, { wipe: true });
    const a = await db.days.get('2026-05-18');
    const b = await db.days.get('2026-05-19');
    expect(a).toBeUndefined();
    expect(b?.sleepHours).toBe(7);
  });

  it('export round-trips through import (merge)', async () => {
    await db.settings.put(baseSettings);
    await db.days.put({ date: '2026-05-18', session: 'done', updatedAt: 1 });
    const dump = await exportAll();
    await db.days.clear();
    await db.settings.clear();
    await importAll(dump, { wipe: false });
    expect((await db.settings.get('singleton'))?.bodyWeightKg).toBe(100);
    expect((await db.days.get('2026-05-18'))?.session).toBe('done');
  });
});
