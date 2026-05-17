/**
 * Tap-to-toggle boolean. Renders `[x]` (on) or `[ ]` (off) in mono.
 * If `label` is provided, the whole component is a full-width row with the
 * label on the left and glyph on the right. Without a label, just the glyph
 * (suitable for use inside a FieldRow's children slot).
 *
 * @example
 *   <ToggleRow value={!!day.hydrationOk} onChange={(v) => patch({ hydrationOk: v })} />
 *   <ToggleRow label="rest day" value={!!day.restDay} onChange={(v) => patch({ restDay: v })} />
 */
import styles from './ToggleRow.module.css';

interface ToggleRowProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  'data-testid'?: string;
}

export function ToggleRow({ value, onChange, label, ...rest }: ToggleRowProps) {
  const glyph = value ? '[x]' : '[ ]';
  const testid = rest['data-testid'];
  if (label) {
    return (
      <button
        type="button"
        aria-pressed={value}
        data-testid={testid}
        className={styles.row}
        onClick={() => onChange(!value)}
      >
        <span className={styles.label}>{label}</span>
        <span className={`${styles.glyph} ${value ? styles.on : styles.off}`}>{glyph}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={value}
      data-testid={testid}
      className={`${styles.glyph} ${styles.standalone} ${value ? styles.on : styles.off}`}
      onClick={() => onChange(!value)}
    >
      {glyph}
    </button>
  );
}
