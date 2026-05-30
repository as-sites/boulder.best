import { useEffect, useState } from 'react';
import { authClient } from '../../lib/auth-client.js';
import {
  useBrowserOnline,
  useManualOfflineMode,
  useSyncEligibility,
} from '../../lib/settings/index.js';
import { useSyncQueueMutation } from './use-sync-queue-mutation.js';
import { useSyncQueueStats } from './use-sync-queue.js';

const AUTO_SYNC_INTERVAL_MS = 15_000;

const useAppForeground = (): boolean => {
  const [isForeground, setIsForeground] = useState(
    () =>
      typeof document === 'undefined' || document.visibilityState === 'visible',
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsForeground(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return isForeground;
};

/**
 * Mount once near the app shell to run automatic queue drains and share sync
 * state.
 */
export const SyncQueueCoordinator = () => {
  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);
  const { enabled: manualOfflineMode } = useManualOfflineMode();
  const isOnline = useBrowserOnline();
  const eligibility = useSyncEligibility(isAuthenticated);
  const { pending, error } = useSyncQueueStats();
  // Eligible count excludes 'syncing' rows — those are already in flight.
  const eligibleCount = pending + error;
  const isAppForeground = useAppForeground();

  const { mutate, isPending } = useSyncQueueMutation();

  useEffect(() => {
    if (
      isPending ||
      session.isPending ||
      !eligibility.canAutoSync ||
      !isAppForeground ||
      eligibleCount === 0
    ) {
      return;
    }

    const syncArgs = {
      manualOfflineMode,
      isOnline,
      isAuthenticated,
      isAppForeground: true,
    };

    // Trigger immediately when new eligible work appears.
    mutate(syncArgs);

    // Periodic retries pick up error items once their back-off window expires.
    const intervalId = window.setInterval(() => {
      mutate(syncArgs);
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    eligibility.canAutoSync,
    eligibleCount,
    isAppForeground,
    isAuthenticated,
    isOnline,
    isPending,
    manualOfflineMode,
    mutate,
    session.isPending,
  ]);

  return null;
};
