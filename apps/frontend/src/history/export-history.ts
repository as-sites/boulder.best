import type { MergedHistoryItem } from './merge-session-history.js';

export type HistoryExportFormat = 'json' | 'csv';

const CSV_HEADERS = [
  'id',
  'source',
  'syncStatus',
  'gymId',
  'gymName',
  'location',
  'startTime',
  'endTime',
  'totalDurationMs',
  'entryCount',
  'isLocalOnly',
] as const;

const MIME_TYPE_BY_FORMAT: Record<HistoryExportFormat, string> = {
  json: 'application/json',
  csv: 'text/csv;charset=utf-8',
};

const escapeCsvValue = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export const buildHistoryExportCsv = (items: MergedHistoryItem[]): string => {
  const rows = items.map((item) =>
    [
      item.id,
      item.source,
      item.syncStatus ?? '',
      item.gymId,
      item.gymName,
      item.location ?? '',
      item.startTime,
      item.endTime,
      String(item.totalDurationMs),
      String(item.entryCount),
      String(item.isLocalOnly),
    ]
      .map((value) => escapeCsvValue(value))
      .join(','),
  );

  return [CSV_HEADERS.join(','), ...rows].join('\n');
};

export const buildHistoryExportJson = (items: MergedHistoryItem[]): string =>
  JSON.stringify(items, null, 2);

export const createHistoryExportFilename = (
  format: HistoryExportFormat,
  date = new Date(),
): string => `climb-history-${date.toISOString().slice(0, 10)}.${format}`;

export const downloadHistoryExport = (
  items: MergedHistoryItem[],
  format: HistoryExportFormat,
) => {
  const payload =
    format === 'csv'
      ? buildHistoryExportCsv(items)
      : buildHistoryExportJson(items);
  const blob = new Blob([payload], { type: MIME_TYPE_BY_FORMAT[format] });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = createHistoryExportFilename(format);
  anchor.click();
  URL.revokeObjectURL(url);
};
