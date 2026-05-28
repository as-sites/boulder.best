import { describe, expect, it } from 'vitest';
import { resolveAppSyncStatus } from '../../src/components/app-sync-status-indicator.js';

describe(resolveAppSyncStatus, () => {
  it('returns synced when the queue is empty', () => {
    expect(resolveAppSyncStatus(0, 0, 0)).toBe('synced');
  });

  it('returns pending when items are waiting to sync', () => {
    expect(resolveAppSyncStatus(2, 0, 0)).toBe('pending');
  });

  it('returns syncing when a drain is in progress', () => {
    expect(resolveAppSyncStatus(1, 0, 1)).toBe('syncing');
  });

  it('returns error when failed items exist, even during a sync', () => {
    expect(resolveAppSyncStatus(2, 1, 1)).toBe('error');
  });

  it('returns error when failed items exist and nothing is syncing', () => {
    expect(resolveAppSyncStatus(2, 1, 0)).toBe('error');
  });
});
