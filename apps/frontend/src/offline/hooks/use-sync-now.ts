import { useCallback } from 'react';
import { authClient } from '../../lib/auth-client.js';
import {
  useBrowserOnline,
  useManualOfflineMode,
  useSyncEligibility,
} from '../../lib/settings/index.js';
import { useSyncQueueMutation } from './use-sync-queue-mutation.js';
import { useSyncQueueHasWork } from './use-sync-queue.js';

export const useSyncNow = () => {
  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);
  const { enabled: manualOfflineMode } = useManualOfflineMode();
  const isOnline = useBrowserOnline();
  const eligibility = useSyncEligibility(isAuthenticated);
  const hasQueueWork = useSyncQueueHasWork();

  const { mutateAsync, isPending: isSyncing } = useSyncQueueMutation();

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

    await mutateAsync({
      manualOfflineMode,
      isOnline,
      isAuthenticated,
      isAppForeground: true,
      forceRetry: true,
    });
  }, [canSyncNow, isAuthenticated, isOnline, manualOfflineMode, mutateAsync]);

  return {
    canSyncNow,
    disabledReason,
    isSyncing,
    syncNow,
  };
};
