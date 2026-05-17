import { describe, expect, it } from 'vitest';
import { weekFor } from '../src/lib/week';
import { parseISO } from '../src/lib/dates';

const MARATHON = parseISO('2026-08-30'); // Sunday

describe('weekFor', () => {
  it('race day is week 15 day 7', () => {
    const r = weekFor(parseISO('2026-08-30'), MARATHON);
    expect(r.weekNumber).toBe(15);
    expect(r.dayOfWeek).toBe(7);
  });

  it('start of week 1 is Mon 2026-05-18 day 1', () => {
    const r = weekFor(parseISO('2026-05-18'), MARATHON);
    expect(r.weekNumber).toBe(1);
    expect(r.dayOfWeek).toBe(1);
  });

  it('Sun 2026-05-17 is pre-week', () => {
    const r = weekFor(parseISO('2026-05-17'), MARATHON);
    expect(r.weekNumber).toBe('pre');
  });

  it('Mon 2026-08-31 (day after race) is post', () => {
    const r = weekFor(parseISO('2026-08-31'), MARATHON);
    expect(r.weekNumber).toBe('post');
    expect(r.dayOfWeek).toBe(1);
  });

  it('mid-block week numbering: Wed 2026-07-01 is week 7 day 3', () => {
    // Week 7 = Mon 2026-06-29 → Sun 2026-07-05
    const r = weekFor(parseISO('2026-07-01'), MARATHON);
    expect(r.weekNumber).toBe(7);
    expect(r.dayOfWeek).toBe(3);
  });
});
