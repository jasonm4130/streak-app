/**
 * 15-column bar chart showing strength sessions per week vs target.
 * - 0 sessions  → subtle grey stub
 * - 1 session   → amber-dim half bar
 * - 2 sessions  → green-dim full bar
 * - 3+ sessions → green full bar
 *
 * @example
 *   <WeeklyTally weeks={weekRollup} target={2} />
 */
import styles from './WeeklyTally.module.css';

interface Week {
  weekNumber: number;
  sessions: number;
}

interface WeeklyTallyProps {
  weeks: Week[];
  target?: number;
}

function classFor(sessions: number, target: number): string {
  if (sessions === 0) return styles.s0;
  if (sessions < target) return styles.s1;
  if (sessions === target) return styles.s2;
  return styles.s3;
}

export function WeeklyTally({ weeks, target = 2 }: WeeklyTallyProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {weeks.map((w) => (
          <div
            key={w.weekNumber}
            className={`${styles.col} ${classFor(w.sessions, target)}`}
            aria-label={`week ${w.weekNumber}: ${w.sessions} sessions`}
          />
        ))}
      </div>
      <div className={styles.axis} aria-hidden>
        {weeks.map((w) => (
          <span key={w.weekNumber}>{w.weekNumber}</span>
        ))}
      </div>
    </div>
  );
}
