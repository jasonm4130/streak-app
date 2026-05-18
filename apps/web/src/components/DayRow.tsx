/**
 * One row in the History list. Shows date, score (hit/total), pct, coloured
 * by adherence band. When expanded, lists every filled field below.
 *
 * @example
 *   <DayRow day={d} score={dayScore(d, settings)} settings={settings}
 *           expanded={open} onExpand={toggle} />
 */
import { format } from 'date-fns';
import type { DayLog, Settings } from '../types';
import type { AdherenceBand } from '../lib/scoring';
import { adherenceBand, fieldHit } from '../lib/scoring';
import { parseISO } from '../lib/dates';
import styles from './DayRow.module.css';

interface DayRowProps {
  day: DayLog;
  score: { hit: number; total: number };
  settings: Settings;
  expanded?: boolean;
  onExpand?: () => void;
}

function bandFor(score: { hit: number; total: number }): AdherenceBand {
  if (score.total === 0) return 'red';
  return adherenceBand(score.hit / score.total);
}

function fmtDate(iso: string): { dow: string; rest: string } {
  const d = parseISO(iso);
  return {
    dow: format(d, 'EEE'),
    rest: format(d, 'dd/MM'),
  };
}

export function DayRow({ day, score, settings, expanded, onExpand }: DayRowProps) {
  const band = bandFor(score);
  const pct = score.total === 0 ? 0 : Math.round((score.hit / score.total) * 100);
  const { dow, rest } = fmtDate(day.date);

  return (
    <>
      <button
        type="button"
        className={`${styles.row} ${styles[band]} ${expanded ? styles.expanded : ''}`}
        onClick={onExpand}
        aria-expanded={!!expanded}
        data-testid={`history-row-${day.date}`}
      >
        <span className={styles.bar} aria-hidden />
        <span className={styles.date}>
          <span className={styles.dow}>{dow}</span> {rest}
        </span>
        <span className={styles.score}>
          {score.hit}/{score.total}
          {day.restDay && <span className={styles.rest}> rest</span>}
        </span>
        <span className={styles.pct}>{pct}%</span>
        <span className={styles.chev} aria-hidden>
          {expanded ? '⌄' : '›'}
        </span>
      </button>

      {expanded && (
        <div className={styles.detail}>
          <Kv k="session" v={day.session ?? null} hit={fieldHit(day, 'session', settings)} />
          <Kv
            k="sleep"
            v={day.sleepHours !== undefined ? `${day.sleepHours}h` : null}
            hit={fieldHit(day, 'sleepHours', settings)}
          />
          <Kv k="weight" v={day.weightKg !== undefined ? `${day.weightKg}kg` : null} hit={fieldHit(day, 'weightKg', settings)} />
          <Kv k="hydration" v={day.hydrationOk ? '✓ pale' : null} hit={fieldHit(day, 'hydrationOk', settings)} />
          <Kv
            k="protein"
            v={day.proteinGrams !== undefined ? `${day.proteinGrams}g` : null}
            hit={fieldHit(day, 'proteinGrams', settings)}
          />
          <Kv k="mobility" v={day.mobilityDone ? '✓ done' : null} hit={fieldHit(day, 'mobilityDone', settings)} />
          <Kv k="reading" v={day.readingDone ? '✓ done' : null} hit={fieldHit(day, 'readingDone', settings)} />
          <Kv
            k="strength"
            v={day.strengthDone ? `✓${day.strengthNote ? ` · ${day.strengthNote}` : ''}` : null}
            hit={!!day.strengthDone}
            optional
          />
        </div>
      )}
    </>
  );
}

interface KvProps {
  k: string;
  v: string | null;
  hit: boolean;
  optional?: boolean;
}

function Kv({ k, v, hit, optional }: KvProps) {
  return (
    <div className={styles.kv}>
      <span className={styles.k}>{k}</span>
      <span className={`${styles.v} ${hit ? styles.hit : optional ? styles.opt : styles.miss}`}>
        {v ?? '—'}
      </span>
    </div>
  );
}
