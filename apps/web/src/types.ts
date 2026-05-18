export type SessionStatus = 'done' | 'modified' | 'skipped';

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

export interface Photo {
  id: string; // ulid
  blob: Blob; // jpeg, downsized 800px longest edge q=0.8
  takenAt: string; // 'YYYY-MM-DD'
}

export interface Settings {
  id: 'singleton';
  bodyWeightKg: number;
  marathonDate: string; // 'YYYY-MM-DD'
  proteinFloorPerKg: number;
  sleepFloorHours: number;
}

export const DEFAULT_SETTINGS: Omit<Settings, 'bodyWeightKg' | 'marathonDate'> = {
  id: 'singleton',
  proteinFloorPerKg: 1.6,
  sleepFloorHours: 7,
};

export const DEFAULT_MARATHON_DATE = '2026-08-30';
