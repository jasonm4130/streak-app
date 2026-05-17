// apps/web/src/screens/History.tsx
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { subDays } from 'date-fns';
import { db } from '../db';
import type { Settings } from '../types';
import { today, parseISO, toISO } from '../lib/dates';
import { dayScore } from '../lib/scoring';
import { DayRow } from '../components/DayRow';

export function History({ settings }: { settings: Settings }) {
  const [windowDays, setWindowDays] = useState(28);
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
    <div style={{ padding: 'var(--space-4)', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', color: 'var(--fg-muted)' }}>
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
        onClick={() => setWindowDays((w) => w + 28)}
        style={{
          marginTop: 'var(--space-5)',
          padding: 'var(--space-3) var(--space-4)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          color: 'var(--fg-muted)',
          width: '100%',
        }}
      >
        load older →
      </button>
    </div>
  );
}
