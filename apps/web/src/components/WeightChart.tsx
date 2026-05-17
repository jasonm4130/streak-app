/**
 * Daily-weight scatter + 7-day rolling average line. Y-axis auto-fits to
 * the data range with a small pad; X-axis is chronological (one position
 * per element, no time scaling — adequate for daily cadence).
 *
 * Renders an empty viewBox when there is no data so the layout doesn't jump.
 *
 * @example
 *   <WeightChart points={dailyKg} rollingAvg={avgKg} height={120} />
 */
import styles from './WeightChart.module.css';

interface Point {
  date: string;
  kg: number;
}

interface WeightChartProps {
  points: Point[];
  rollingAvg: Point[];
  height?: number;
}

const VIEW_W = 320;

export function WeightChart({ points, rollingAvg, height = 130 }: WeightChartProps) {
  if (points.length === 0) {
    return (
      <div className={styles.wrap} style={{ height }}>
        <div className={styles.empty}>no weight data yet</div>
      </div>
    );
  }

  const all = [...points.map((p) => p.kg), ...rollingAvg.map((p) => p.kg)];
  const minRaw = Math.min(...all);
  const maxRaw = Math.max(...all);
  const pad = Math.max(0.5, (maxRaw - minRaw) * 0.1);
  const min = minRaw - pad;
  const max = maxRaw + pad;
  const range = max - min || 1;

  const total = Math.max(points.length, rollingAvg.length, 1);
  const xFor = (i: number) => (i / Math.max(1, total - 1)) * VIEW_W;
  const yFor = (kg: number) =>
    height - ((kg - min) / range) * (height - 20) - 10;

  const linePath = rollingAvg
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)},${yFor(p.kg).toFixed(1)}`)
    .join(' ');

  const lastAvg = rollingAvg[rollingAvg.length - 1];

  return (
    <div className={styles.wrap} style={{ height }}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        aria-label={`Weight chart, ${points.length} daily points`}
      >
        {/* gridlines */}
        <g className={styles.grid}>
          <line x1="0" y1={yFor(min + range * 0.25)} x2={VIEW_W} y2={yFor(min + range * 0.25)} />
          <line x1="0" y1={yFor(min + range * 0.5)} x2={VIEW_W} y2={yFor(min + range * 0.5)} />
          <line x1="0" y1={yFor(min + range * 0.75)} x2={VIEW_W} y2={yFor(min + range * 0.75)} />
        </g>
        {/* daily scatter */}
        <g className={styles.dots}>
          {points.map((p, i) => (
            <circle
              key={p.date}
              cx={xFor(i)}
              cy={yFor(p.kg)}
              r={1.7}
            />
          ))}
        </g>
        {/* rolling avg */}
        {linePath && <path d={linePath} className={styles.line} />}
        {/* current marker */}
        {lastAvg && (
          <circle
            cx={xFor(rollingAvg.length - 1)}
            cy={yFor(lastAvg.kg)}
            r={3}
            className={styles.current}
          />
        )}
      </svg>
      <div className={styles.yLabels} aria-hidden>
        <span>{max.toFixed(0)}</span>
        <span>{min.toFixed(0)}</span>
      </div>
    </div>
  );
}
