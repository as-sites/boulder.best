import { describe, expect, it } from 'vitest';
import {
  sortSessionDetailEntries,
  sortSyncedImages,
} from '../../src/history/sort-session-detail.js';

describe('session detail ordering', () => {
  it('sorts entries by sequenceOrder', () => {
    const sorted = sortSessionDetailEntries([
      {
        id: 'break-1',
        sequenceOrder: 2,
        durationMs: 1000,
        type: 'break',
      },
      {
        id: 'climb-1',
        sequenceOrder: 0,
        durationMs: 2000,
        type: 'climb',
        name: 'Warm up',
        grade: 'V1',
        attempts: 1,
        notes: '',
        images: [],
      },
    ]);

    expect(sorted.map((entry) => entry.sequenceOrder)).toEqual([0, 2]);
  });

  it('sorts synced images by index', () => {
    const sorted = sortSyncedImages([
      {
        id: '22222222-2222-4222-8222-222222222222',
        index: 2,
        objectKey: 'two',
        photoUrl: 'https://cdn.example.com/two.webp',
        contentType: 'image/webp',
        contentLength: 100,
      },
      {
        id: '11111111-1111-4111-8111-111111111111',
        index: 0,
        objectKey: 'zero',
        photoUrl: 'https://cdn.example.com/zero.webp',
        contentType: 'image/webp',
        contentLength: 100,
      },
    ]);

    expect(sorted.map((image) => image.index)).toEqual([0, 2]);
  });
});
