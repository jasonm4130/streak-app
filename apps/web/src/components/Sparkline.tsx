/**
 * Tiny SVG bar sparkline. One bar per value. Values normalised 0..1.
 * `bandFn` colours bars per value; defaults to foam everywhere.
 *
 * @example
 *   <Sparkline values={days.map(d => d.score)} bandFn={adherenceBand} />
 */
import type { AdherenceBand } from '../lib/scoring';
import styles from './Sparkline.module.css';

interface SparklineProps {
  values: number[]; // 0..1
  width?: number;
  height?: number;
  bandFn?: (v: number) => AdherenceBand;
}

const BAND_COLOR: Record<AdherenceBand, string> = {
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
};

export function Sparkline({
  values,
  width = 100,
  height = 24,
  bandFn,
}: SparklineProps) {
  if (values.length === 0) {
    return (
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden
      />
    );
  }
  const gap = 1;
  const barW = Math.max(1, (width - gap * (values.length - 1)) / values.length);
  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {values.map((v, i) => {
        const clamped = Math.max(0, Math.min(1, v));
        const h = Math.max(1, clamped * (height - 2));
        const x = i * (barW + gap);
        const y = height - h;
        const fill = bandFn ? BAND_COLOR[bandFn(clamped)] : 'var(--fg-muted)';
        return <rect key={i} x={x} y={y} width={barW} height={h} fill={fill} />;
      })}
    </svg>
  );
}
