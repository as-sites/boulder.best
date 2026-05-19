import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { SyncQueuePanel } from '../../src/components/sync-queue-panel.js';
import { resetOfflineDatabase } from '../../src/offline/index.js';

const syncNowMock = vi.hoisted(() => vi.fn());

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
  useSyncQueueList: () => [],
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
});
