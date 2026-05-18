/**
 * Date helpers that operate in the user's LOCAL timezone, never UTC.
 *
 * The whole point of this module is to keep day boundaries aligned with the
 * user's wall clock. We can't use `date-fns/parseISO` or `Date.toISOString()`
 * directly because those introduce UTC drift: a day logged at 23:00 local
 * would round to the wrong calendar date.
 */
import { format } from 'date-fns';

/** Today's date as a local-TZ `YYYY-MM-DD` string (local midnight, not UTC). */
export function today(): string {
  return toISO(new Date());
}

/** Format a `Date` as a local-TZ `YYYY-MM-DD` string. Does NOT use UTC. */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a `YYYY-MM-DD` string as local midnight (not UTC midnight). */
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Human-readable form for UI, e.g. `Mon 18 May`. */
export function formatDisplay(iso: string): string {
  return format(parseISO(iso), 'EEE d MMM');
}
