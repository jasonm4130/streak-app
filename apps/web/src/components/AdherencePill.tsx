/**
 * Compact pill showing an adherence percentage with a small label.
 * Border colour reflects the band (green/amber/red).
 *
 * @example
 *   <AdherencePill value={0.86} band="green" label="28d adherence" />
 */
import type { AdherenceBand } from '../lib/scoring';
import styles from './AdherencePill.module.css';

interface AdherencePillProps {
  value: number; // 0..1
  band: AdherenceBand;
  label: string;
}

export function AdherencePill({ value, band, label }: AdherencePillProps) {
  const pct = Math.round(value * 100);
  return (
    <div
      className={`${styles.pill} ${styles[band]}`}
      role="status"
      aria-label={`${label}: ${pct} percent`}
    >
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        <span className={styles.num}>{pct}</span>
        <span className={styles.pct}>%</span>
      </div>
    </div>
  );
}
