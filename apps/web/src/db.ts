/**
 * Dexie (IndexedDB) singleton. All local persistent state lives here.
 *
 * Schema versions are declared in the constructor — bump a new `.version(N)`
 * call rather than mutating an existing one when changing the schema, or
 * existing users' databases will fail to open. Primary keys: `days.date`
 * (local-TZ `YYYY-MM-DD`), `photos.id` (ulid), `settings.id` (always the
 * literal `'singleton'`).
 */
import Dexie, { type EntityTable } from 'dexie';
import type { DayLog, Photo, Settings } from './types';

class StreakDb extends Dexie {
  days!: EntityTable<DayLog, 'date'>;
  photos!: EntityTable<Photo, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('streak');
    this.version(1).stores({
      // Primary key first, then indices
      days: 'date, updatedAt',
      photos: 'id, takenAt',
      settings: 'id',
    });
  }
}

export const db = new StreakDb();
