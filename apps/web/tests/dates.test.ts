import { describe, expect, it } from 'vitest';
import { today, formatDisplay, parseISO, toISO } from '../src/lib/dates';

describe('dates', () => {
  it('today() returns local YYYY-MM-DD', () => {
    const t = today();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d = new Date();
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(t).toBe(local);
  });

  it('formatDisplay renders "Sun 17 May"', () => {
    expect(formatDisplay('2026-05-17')).toBe('Sun 17 May');
  });

  it('toISO round-trips from a Date', () => {
    const d = new Date(2026, 4, 17);
    expect(toISO(d)).toBe('2026-05-17');
  });

  it('parseISO yields a Date at local midnight', () => {
    const d = parseISO('2026-05-17');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(17);
    expect(d.getHours()).toBe(0);
  });
});
