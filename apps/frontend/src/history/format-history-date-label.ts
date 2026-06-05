const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Stable local calendar-day index (immune to DST 23h/25h midnight gaps). */
const localCalendarDayIndex = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;

/**
 * Formats a session date as a section heading ("Today", "Yesterday", or "May
 * 20, 2026").
 */
export const formatHistoryDateLabel = (
  isoDate: string,
  now: Date = new Date(),
): string => {
  const sessionDay = startOfDay(new Date(isoDate));
  const today = startOfDay(now);
  const diffDays =
    localCalendarDayIndex(today) - localCalendarDayIndex(sessionDay);

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  return sessionDay.toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
};

/** Calendar day key for grouping history items (local timezone). */
export const historyDateGroupKey = (isoDate: string): string => {
  const date = new Date(isoDate);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};
