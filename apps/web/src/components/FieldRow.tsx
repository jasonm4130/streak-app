/**
 * One row in the Today list. Status glyph on the left, label in the middle,
 * controls (children) on the right. Whole row is tappable when `onClick` is set.
 *
 * @example
 *   <FieldRow label="sleep ≥7h" status="hit">
 *     <NumberInput value={day.sleepHours} onChange={...} suffix="h" />
 *   </FieldRow>
 */
import type { ReactNode } from 'react';
import styles from './FieldRow.module.css';

type Status = 'hit' | 'miss' | 'pending';

interface FieldRowProps {
  label: string;
  status: Status;
  children: ReactNode;
  onClick?: () => void;
}

const GLYPH: Record<Status, string> = {
  hit: '●',
  miss: '●',
  pending: '○',
};

export function FieldRow({ label, status, children, onClick }: FieldRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`${styles.row} ${onClick ? styles.tappable : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span className={`${styles.glyph} ${styles[status]}`} aria-hidden>
        {GLYPH[status]}
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.ctrl}>{children}</span>
    </Tag>
  );
}
