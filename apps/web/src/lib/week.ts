import { differenceInCalendarDays, addDays } from 'date-fns';

export interface WeekInfo {
  weekNumber: number | 'pre' | 'post';
  dayOfWeek: number; // 1 (Mon) .. 7 (Sun); 0 only in 'pre'/'post' edge irrelevant
}

const TOTAL_WEEKS = 15;

// Race week (week 15) ends on the marathon Sunday. Week N starts on the Monday.
function week1Start(marathonDate: Date): Date {
  // marathonDate is the Sunday of week 15. Week 1 Monday is marathonDate - 14*7 - 6 days.
  return addDays(marathonDate, -(TOTAL_WEEKS - 1) * 7 - 6);
}

export function weekFor(date: Date, marathonDate: Date): WeekInfo {
  const w1 = week1Start(marathonDate);
  const daysFromW1Start = differenceInCalendarDays(date, w1);
  if (daysFromW1Start < 0) {
    // pre-week: dayOfWeek unused
    return { weekNumber: 'pre', dayOfWeek: 0 };
  }
  if (date > marathonDate) {
    // post: dayOfWeek is days since race
    const post = differenceInCalendarDays(date, marathonDate);
    return { weekNumber: 'post', dayOfWeek: post };
  }
  const weekIndex0 = Math.floor(daysFromW1Start / 7); // 0..14
  const dayOfWeek = (daysFromW1Start % 7) + 1; // 1..7
  return { weekNumber: weekIndex0 + 1, dayOfWeek };
}

export { week1Start };
