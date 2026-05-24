import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import {
  mergeSessionHistory,
  type MergedHistoryItem,
} from '../../src/history/merge-session-history.js';
import { sessionHistoryQueryKey } from '../../src/history/use-session-history-query.js';
import type { SyncQueueItem } from '../../src/offline/db/types.js';
import { useSyncNow } from '../../src/offline/hooks/use-sync-now.js';

const drainMocks = vi.hoisted(() => ({
  drainSyncQueue: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

const settingsMocks = vi.hoisted(() => ({
  useManualOfflineMode: vi.fn(),
  useBrowserOnline: vi.fn(),
  useSyncEligibility: vi.fn(),
}));

const queueMocks = vi.hoisted(() => ({
  useSyncQueueHasWork: vi.fn(),
}));

vi.mock(import('../../src/offline/sync/drain-sync-queue.js'), () => ({
  drainSyncQueue: drainMocks.drainSyncQueue,
}));

vi.mock(import('../../src/lib/auth-client.js'), () => ({
  authClient: {
    useSession: authMocks.useSession,
    getSession: vi.fn(),
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
      passkey: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
    passkey: {
      addPasskey: vi.fn(),
    },
  },
}));

vi.mock(import('../../src/lib/settings/index.js'), () => ({
  useManualOfflineMode: settingsMocks.useManualOfflineMode,
  useBrowserOnline: settingsMocks.useBrowserOnline,
  useSyncEligibility: settingsMocks.useSyncEligibility,
}));

vi.mock(import('../../src/offline/hooks/use-sync-queue.js'), () => ({
  useSyncQueueHasWork: queueMocks.useSyncQueueHasWork,
}));

const signedInSession = () => ({
  data: { user: { id: 'user-1' } },
  error: null,
  isPending: false,
  isRefetching: false,
  refetch: vi.fn(),
});

const eligibleSyncContext = () => {
  authMocks.useSession.mockReturnValue(signedInSession());
  settingsMocks.useManualOfflineMode.mockReturnValue({ enabled: false });
  settingsMocks.useBrowserOnline.mockReturnValue(true);
  settingsMocks.useSyncEligibility.mockReturnValue({ canAutoSync: true });
  queueMocks.useSyncQueueHasWork.mockReturnValue(true);
  drainMocks.drainSyncQueue.mockResolvedValue(undefined);
};

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('manual sync hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eligibleSyncContext();
  });

  it('invalidates session history after a successful manual sync', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSyncNow(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.syncNow();
    });

    expect(drainMocks.drainSyncQueue).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sessionHistoryQueryKey,
    });
  });

  it('does not invalidate when sync is not allowed', async () => {
    queueMocks.useSyncQueueHasWork.mockReturnValue(false);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSyncNow(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.syncNow();
    });

    expect(drainMocks.drainSyncQueue).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('does not invalidate when draining the queue throws', async () => {
    drainMocks.drainSyncQueue.mockRejectedValue(new Error('Sync interrupted'));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSyncNow(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.syncNow()).rejects.toThrow(
        'Sync interrupted',
      );
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('post-sync merged history', () => {
  it('shows server rows only after queue items sync and server list refreshes', () => {
    const pendingQueueItem: SyncQueueItem = {
      id: 'queue-1',
      sessionId: 'session-1',
      payload: {
        id: 'session-1',
        gymId: 'gym-1',
        startTime: '2026-05-22T10:00:00.000Z',
        endTime: '2026-05-22T11:00:00.000Z',
        totalDurationMs: 3_600_000,
        notes: '',
        entries: [],
      },
      status: 'pending',
      retryCount: 0,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    };

    const beforeSync = mergeSessionHistory([], [pendingQueueItem], {
      'gym-1': 'Local Gym',
    });
    expect(beforeSync).toHaveLength(1);
    expect(beforeSync[0]?.isLocalOnly).toBe(true);

    const syncedQueueItem: SyncQueueItem = {
      ...pendingQueueItem,
      status: 'synced',
    };
    const refreshedServerItems = [
      {
        id: 'session-1',
        gymId: 'gym-1',
        gymName: 'Local Gym',
        startTime: '2026-05-22T10:00:00.000Z',
        endTime: '2026-05-22T11:00:00.000Z',
        totalDurationMs: 3_600_000,
        entryCount: 0,
      },
    ];

    const afterSync = mergeSessionHistory(
      refreshedServerItems,
      [syncedQueueItem],
      { 'gym-1': 'Local Gym' },
    );

    expect(afterSync).toHaveLength(1);
    expect(afterSync[0]).toMatchObject({
      id: 'session-1',
      source: 'server',
      isLocalOnly: false,
    } satisfies Partial<MergedHistoryItem>);
    expect(afterSync.filter((item) => item.isLocalOnly)).toEqual([]);
  });
});
