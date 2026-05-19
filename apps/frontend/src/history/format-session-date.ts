/** Formats a session ISO timestamp as "May 20, 2026, 12:00 AM". */
export const formatSessionDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
