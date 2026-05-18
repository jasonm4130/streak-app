/** Whether the day's training session was completed as-planned, adapted, or skipped. */
export type SessionStatus = 'done' | 'modified' | 'skipped';

/**
 * One row per calendar day. `date` is the primary key as a local-TZ
 * `YYYY-MM-DD` string (not UTC) so day boundaries match the user's wall clock.
 * All field columns are optional — a fresh day is `{date, updatedAt}` only and
 * gets filled in as the user logs through the day.
 */
export interface DayLog {
  date: string; // ISO 'YYYY-MM-DD', local timezone, primary key
  session?: SessionStatus;
  sleepHours?: number;
  weightKg?: number;
  hydrationOk?: boolean;
  proteinGrams?: number;
  mobilityDone?: boolean;
  readingDone?: boolean;
  strengthDone?: boolean;
  strengthNote?: string;
  photoBlobId?: string;
  restDay?: boolean;
  updatedAt: number; // epoch ms
}

/**
 * Stored body photo. `blob` is the downsized JPEG (see `lib/photos.downsize`);
 * `takenAt` is the local-TZ `YYYY-MM-DD` of the day it was logged, not an
 * EXIF capture time.
 */
export interface Photo {
  id: string; // ulid
  blob: Blob; // jpeg, downsized 800px longest edge q=0.8
  takenAt: string; // 'YYYY-MM-DD'
}

/**
 * User settings. Stored as a single row keyed by the literal `'singleton'`
 * — there is only ever one settings record in the database.
 */
export interface Settings {
  id: 'singleton';
  bodyWeightKg: number;
  marathonDate: string; // 'YYYY-MM-DD'
  proteinFloorPerKg: number;
  sleepFloorHours: number;
}

/** Defaults applied at first onboarding. */
export const DEFAULT_SETTINGS: Omit<Settings, 'bodyWeightKg' | 'marathonDate'> = {
  id: 'singleton',
  proteinFloorPerKg: 1.6,
  sleepFloorHours: 7,
};

/** Reference race day from the original spec; user can override during onboarding. */
export const DEFAULT_MARATHON_DATE = '2026-08-30';
