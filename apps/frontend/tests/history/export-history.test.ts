import { describe, expect, it } from 'vitest';
import {
  buildHistoryExportCsv,
  buildHistoryExportJson,
  createHistoryExportFilename,
} from '../../src/history/export-history.js';
import type { MergedHistoryItem } from '../../src/history/merge-session-history.js';

const items: MergedHistoryItem[] = [
  {
    id: 'local-1',
    source: 'local',
    syncStatus: 'pending',
    gymId: 'gym-1',
    gymName: 'Boulder, Gym',
    location: 'Main "Cave"',
    startTime: '2026-05-22T10:00:00.000Z',
    endTime: '2026-05-22T11:00:00.000Z',
    totalDurationMs: 3_600_000,
    entryCount: 2,
    isLocalOnly: true,
  },
];

describe('history export', () => {
  it('serializes history as csv', () => {
    expect(buildHistoryExportCsv(items)).toBe(
      [
        'id,source,syncStatus,gymId,gymName,location,startTime,endTime,totalDurationMs,entryCount,isLocalOnly',
        'local-1,local,pending,gym-1,"Boulder, Gym","Main ""Cave""",2026-05-22T10:00:00.000Z,2026-05-22T11:00:00.000Z,3600000,2,true',
      ].join('\n'),
    );
  });

  it('serializes history as json', () => {
    expect(JSON.parse(buildHistoryExportJson(items))).toEqual(items);
  });

  it('creates a date-based export filename', () => {
    expect(
      createHistoryExportFilename('json', new Date('2026-06-07T14:00:00.000Z')),
    ).toBe('climb-history-2026-06-07.json');
  });
});
