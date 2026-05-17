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
