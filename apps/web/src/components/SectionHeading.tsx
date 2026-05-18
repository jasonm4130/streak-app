/**
 * Small uppercase-style section heading used on the Stats screen.
 * Renders an `<h2>` with muted colour, 12px size, and letter-spacing.
 * Accepts `data-testid` so screens can keep their existing test hooks.
 *
 * @example
 *   <SectionHeading data-testid="stats-section-weight">
 *     WEIGHT — last 90 days
 *   </SectionHeading>
 */
import type { ReactNode } from 'react';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  children: ReactNode;
  'data-testid'?: string;
}

export function SectionHeading({ children, 'data-testid': testId }: SectionHeadingProps) {
  return (
    <h2 className={styles.heading} data-testid={testId}>
      {children}
    </h2>
  );
}
