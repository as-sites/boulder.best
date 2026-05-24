import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessionHistoryQueryKey } from '../../history/use-session-history-query.js';
import { authClient } from '../../lib/auth-client.js';
import {
  useBrowserOnline,
  useManualOfflineMode,
  useSyncEligibility,
} from '../../lib/settings/index.js';
import { drainSyncQueue } from '../sync/drain-sync-queue.js';
import { useSyncQueueHasWork } from './use-sync-queue.js';

export const useSyncNow = () => {
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);
  const { enabled: manualOfflineMode } = useManualOfflineMode();
  const isOnline = useBrowserOnline();
  const eligibility = useSyncEligibility(isAuthenticated);
  const hasQueueWork = useSyncQueueHasWork();
  const [isSyncing, setIsSyncing] = useState(false);

  const canSyncNow =
    eligibility.canAutoSync && hasQueueWork && !isSyncing && !session.isPending;

  const disabledReason = manualOfflineMode
    ? 'Turn off manual offline mode to sync queued sessions.'
    : !isOnline
      ? 'Sync is unavailable while your browser is offline.'
      : !isAuthenticated
        ? 'Sign in to sync queued sessions.'
        : !hasQueueWork
          ? 'Nothing in the sync queue to upload.'
          : undefined;

  const syncNow = useCallback(async () => {
    if (!canSyncNow) {
      return;
    }

    setIsSyncing(true);
    try {
      await drainSyncQueue({
        manualOfflineMode,
        isOnline,
        isAuthenticated,
        isAppForeground: true,
        forceRetry: true,
      });
      await queryClient.invalidateQueries({
        queryKey: sessionHistoryQueryKey,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [canSyncNow, isAuthenticated, isOnline, manualOfflineMode, queryClient]);

  return {
    canSyncNow,
    disabledReason,
    isSyncing,
    syncNow,
  };
};
