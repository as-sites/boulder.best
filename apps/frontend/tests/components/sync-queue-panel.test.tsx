import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { SyncQueuePanel } from '../../src/components/sync-queue-panel.js';
import {
  resetOfflineDatabase,
  type SyncQueueItem,
  type SyncSessionPayload,
} from '../../src/offline/index.js';

const syncNowMock = vi.hoisted(() => vi.fn());

const errorItemFixture = (): SyncQueueItem => ({
  id: 'queue-error-1',
  sessionId: 'session-failed-1',
  payload: {
    id: 'session-failed-1',
    gymId: 'gym-1',
    startTime: '2026-05-18T10:00:00Z',
    endTime: '2026-05-18T12:00:00Z',
    totalDurationMs: 0,
    notes: '',
    entries: [],
  } satisfies SyncSessionPayload,
  status: 'error',
  retryCount: 3,
  lastError: 'Server rejected payload',
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_200_000,
});

vi.mock(import('../../src/offline/hooks/use-sync-now.js'), () => ({
  useSyncNow: () => ({
    canSyncNow: false,
    disabledReason: 'Turn off manual offline mode to sync queued sessions.',
    isSyncing: false,
    syncNow: syncNowMock,
  }),
}));

vi.mock(import('../../src/offline/hooks/use-sync-queue.js'), () => ({
  useSyncQueuePendingCount: () => 2,
  useSyncQueueErrorCount: () => 1,
  useSyncQueueErrorList: () => [errorItemFixture()],
  useSyncQueueList: () => [],
  useSyncQueueHasWork: () => true,
}));

vi.mock(import('../../src/offline/hooks/use-sync-queue-last-error.js'), () => ({
  useSyncQueueLastError: () => 'Network Error',
}));

describe('sync queue panel', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
    syncNowMock.mockReset();
  });

  it('shows queue counts, last error, and disabled sync guidance', () => {
    render(
      <MantineProvider>
        <SyncQueuePanel />
      </MantineProvider>,
    );

    expect(screen.getByText(/2 pending/i)).toBeDefined();
    expect(screen.getByText(/1 failed/i)).toBeDefined();
    expect(screen.getByText(/last error: network error/i)).toBeDefined();
    expect(screen.getByText(/turn off manual offline mode/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /sync now/i })).toBeDisabled();
  });

  it('lists failed items with export, support helpers, and clear action', () => {
    render(
      <MantineProvider>
        <SyncQueuePanel />
      </MantineProvider>,
    );

    expect(screen.getByText(/session session-failed-1/i)).toBeDefined();
    expect(screen.getByText(/server rejected payload/i)).toBeDefined();
    expect(screen.getByText(/retries: 3/i)).toBeDefined();
    expect(
      screen.getByText(/photo files stay on this device and are not included/i),
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /download json/i }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /clear from device/i }),
    ).toBeDefined();
    expect(screen.getByRole('link', { name: /email support/i })).toBeDefined();
  });

  it('shows destructive confirmation before clearing', () => {
    render(
      <MantineProvider>
        <SyncQueuePanel />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /clear from device/i }));

    expect(
      screen.getByText(/cannot be re-synced automatically/i),
    ).toBeDefined();
    expect(
      screen.getByText(/export the json first if you want the maintainer/i),
    ).toBeDefined();
  });
});
