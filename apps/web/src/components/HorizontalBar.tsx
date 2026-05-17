/**
 * One horizontal bar row: mono label · filled track · numeric value.
 * `value` and `max` together define the fill percentage; `value` alone (with
 * default max=1) means a 0..1 normalised value. `showPercent` formats the
 * right-hand label as "%".
 *
 * @example
 *   <HorizontalBar label="session" value={0.96} band="green" showPercent />
 */
import type { AdherenceBand } from '../lib/scoring';
import styles from './HorizontalBar.module.css';

interface HorizontalBarProps {
  label: string;
  value: number;
  max?: number;
  band?: AdherenceBand;
  showPercent?: boolean;
}

export function HorizontalBar({
  label,
  value,
  max = 1,
  band,
  showPercent = false,
}: HorizontalBarProps) {
  const ratio = max === 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const display = showPercent ? `${Math.round(ratio * 100)}` : String(value);
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.track}>
        <span
          className={`${styles.fill} ${band ? styles[band] : ''}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span className={`${styles.value} ${band ? styles[band] : ''}`}>{display}</span>
    </div>
  );
}
