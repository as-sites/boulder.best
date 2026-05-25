import { useEffect, useRef, useState } from 'react';
import { authClient } from '../../lib/auth-client.js';
import {
  useBrowserOnline,
  useManualOfflineMode,
  useSyncEligibility,
} from '../../lib/settings/index.js';
import { useSyncQueueMutation } from './use-sync-queue-mutation.js';
import { useSyncQueueHasWork } from './use-sync-queue.js';

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
  const hasQueueWork = useSyncQueueHasWork();
  const isAppForeground = useAppForeground();
  const lastAutoSyncAtRef = useRef(0);

  const { mutate, isPending } = useSyncQueueMutation();

  useEffect(() => {
    if (isPending || session.isPending) {
      return;
    }

    if (!eligibility.canAutoSync || !hasQueueWork || !isAppForeground) {
      return;
    }

    mutate({
      manualOfflineMode,
      isOnline,
      isAuthenticated,
      isAppForeground: true,
    });
  }, [
    eligibility.canAutoSync,
    hasQueueWork,
    isAppForeground,
    isAuthenticated,
    isOnline,
    isPending,
    manualOfflineMode,
    mutate,
    session.isPending,
  ]);

  useEffect(() => {
    if (!eligibility.canAutoSync || !hasQueueWork || !isAppForeground) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (isPending || session.isPending) {
        return;
      }

      const now = Date.now();
      if (now - lastAutoSyncAtRef.current < AUTO_SYNC_INTERVAL_MS) {
        return;
      }

      lastAutoSyncAtRef.current = now;
      mutate({
        manualOfflineMode,
        isOnline,
        isAuthenticated,
        isAppForeground: true,
      });
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    eligibility.canAutoSync,
    hasQueueWork,
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
