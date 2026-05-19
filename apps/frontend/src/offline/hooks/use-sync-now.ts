import { useCallback, useState } from 'react';
import { authClient } from '../../lib/auth-client.js';
import {
  useBrowserOnline,
  useManualOfflineMode,
  useSyncEligibility,
} from '../../lib/settings/index.js';
import { drainSyncQueue } from '../sync/drain-sync-queue.js';

export const useSyncNow = () => {
  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);
  const { enabled: manualOfflineMode } = useManualOfflineMode();
  const isOnline = useBrowserOnline();
  const eligibility = useSyncEligibility(isAuthenticated);
  const [isSyncing, setIsSyncing] = useState(false);

  const canSyncNow =
    eligibility.canAutoSync && !isSyncing && !session.isPending;

  const disabledReason = manualOfflineMode
    ? 'Turn off manual offline mode to sync queued sessions.'
    : !isOnline
      ? 'Sync is unavailable while your browser is offline.'
      : !isAuthenticated
        ? 'Sign in to sync queued sessions.'
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
      });
    } finally {
      setIsSyncing(false);
    }
  }, [canSyncNow, isAuthenticated, isOnline, manualOfflineMode]);

  return {
    canSyncNow,
    disabledReason,
    isSyncing,
    syncNow,
  };
};
