// apps/web/src/screens/History.tsx
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { subDays } from 'date-fns';
import { db } from '../db';
import type { Settings } from '../types';
import { today, parseISO, toISO } from '../lib/dates';
import { dayScore } from '../lib/scoring';
import { DayRow } from '../components/DayRow';
import { ADHERENCE_WINDOW_DAYS } from '../lib/constants';
import styles from './History.module.css';

export function History({ settings }: { settings: Settings }) {
  const [windowDays, setWindowDays] = useState(ADHERENCE_WINDOW_DAYS);
  const [expanded, setExpanded] = useState<string | null>(null);

  const days = useLiveQuery(
    async () => {
      const end = today();
      const start = toISO(subDays(parseISO(end), windowDays - 1));
      return db.days.where('date').between(start, end, true, true).reverse().sortBy('date');
    },
    [windowDays],
  ) ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.summary}>
        <span>last {windowDays} days</span>
        <span>{days.length} logged</span>
      </div>

      {days.map((d) => (
        <DayRow
          key={d.date}
          day={d}
          score={dayScore(d, settings)}
          settings={settings}
          expanded={expanded === d.date}
          onExpand={() => setExpanded((cur) => (cur === d.date ? null : d.date))}
        />
      ))}

      <button
        onClick={() => setWindowDays((w) => w + ADHERENCE_WINDOW_DAYS)}
        className={styles.loadMore}
      >
        load older →
      </button>
    </div>
  );
}
