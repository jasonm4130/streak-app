/** 28-day rolling window for adherence pill on Today. */
export const ADHERENCE_WINDOW_DAYS = 28;

/** 60-day window for the weight scatter + 7-day rolling avg on Stats. */
export const WEIGHT_WINDOW_DAYS = 60;

/** Weeks in a Sydney Marathon prep block. */
export const TOTAL_WEEKS = 15;

/** Strength sessions/week target (Stats WeeklyTally + protein/strength labels). */
export const STRENGTH_TARGET_PER_WEEK = 2;

/** Adherence band thresholds (used by lib/scoring.ts adherenceBand). */
export const BAND_GREEN_THRESHOLD = 0.85;
export const BAND_AMBER_THRESHOLD = 0.7;

/** Photo downsize parameters (lib/photos.ts downsize). */
export const PHOTO_MAX_EDGE_PX = 800;
export const PHOTO_JPEG_QUALITY = 0.8;

/** Rolling-avg window for weight chart on Stats. */
export const WEIGHT_ROLLING_AVG_DAYS = 7;
