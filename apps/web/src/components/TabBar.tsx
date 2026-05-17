/**
 * Bottom-fixed tab bar. Four tabs, 64pt high plus safe-area padding.
 * Active tab gets a foam top-border and foam glyph + label colour.
 *
 * @example
 *   <TabBar tab="today" onSelect={setTab} />
 */
import type { TabKey } from '../store';
import styles from './TabBar.module.css';

interface Tab {
  key: TabKey;
  glyph: string;
  label: string;
}

const TABS: Tab[] = [
  { key: 'today', glyph: '●', label: 'today' },
  { key: 'history', glyph: '≡', label: 'history' },
  { key: 'stats', glyph: '▤', label: 'stats' },
  { key: 'settings', glyph: '⚙', label: 'settings' },
];

interface TabBarProps {
  tab: TabKey;
  onSelect: (t: TabKey) => void;
}

export function TabBar({ tab, onSelect }: TabBarProps) {
  return (
    <nav className={styles.bar} role="tablist" aria-label="primary">
      {TABS.map((t) => {
        const active = t.key === tab;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={t.label}
            data-testid={`tab-${t.key}`}
            className={`${styles.tab} ${active ? styles.active : ''}`}
            onClick={() => onSelect(t.key)}
          >
            <span className={styles.glyph} aria-hidden>
              {t.glyph}
            </span>
            <span className={styles.label}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
