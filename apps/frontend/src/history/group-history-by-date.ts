import {
  formatHistoryDateLabel,
  historyDateGroupKey,
} from './format-history-date-label.js';
import type { MergedHistoryItem } from './merge-session-history.js';

export interface HistoryDateGroup {
  key: string;
  label: string;
  items: MergedHistoryItem[];
}

/**
 * Groups history items by calendar day, preserving newest-first order within
 * each group.
 */
export const groupHistoryByDate = (
  items: MergedHistoryItem[],
  now: Date = new Date(),
): HistoryDateGroup[] => {
  const groups = new Map<string, HistoryDateGroup>();

  for (const item of items) {
    const key = historyDateGroupKey(item.startTime);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, {
      key,
      label: formatHistoryDateLabel(item.startTime, now),
      items: [item],
    });
  }

  return [...groups.values()];
};
