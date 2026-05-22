import { useSyncExternalStore } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import {
  canAutoSync,
  isEffectivelyOffline,
  type SyncEligibilityInput,
} from './sync-eligibility.js';

const MANUAL_OFFLINE_STORAGE_KEY = 'boulder.manualOfflineMode';
const TIMER_MILLISECONDS_STORAGE_KEY = 'boulder.timerDisplayMilliseconds';

const subscribeToOnlineStatus = (onStoreChange: () => void): (() => void) => {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
};

const getOnlineSnapshot = (): boolean => navigator.onLine;

export const useBrowserOnline = (): boolean =>
  useSyncExternalStore(subscribeToOnlineStatus, getOnlineSnapshot, () => true);

export const useManualOfflineMode = () => {
  const [enabled, setEnabled] = useLocalStorage<boolean>({
    key: MANUAL_OFFLINE_STORAGE_KEY,
    defaultValue: false,
  });

  return {
    enabled,
    setEnabled,
    toggle: () => {
      setEnabled((current) => !current);
    },
  };
};

export const useTimerDisplayMilliseconds = () => {
  const [enabled, setEnabled] = useLocalStorage<boolean>({
    key: TIMER_MILLISECONDS_STORAGE_KEY,
    defaultValue: false,
  });

  return {
    enabled,
    setEnabled,
    toggle: () => {
      setEnabled((current) => !current);
    },
  };
};

export const useSyncEligibility = (
  isAuthenticated: boolean,
): SyncEligibilityInput & {
  canAutoSync: boolean;
  isEffectivelyOffline: boolean;
} => {
  const manualOfflineMode = useManualOfflineMode().enabled;
  const isOnline = useBrowserOnline();

  const input: SyncEligibilityInput = {
    manualOfflineMode,
    isOnline,
    isAuthenticated,
  };

  return {
    ...input,
    canAutoSync: canAutoSync(input),
    isEffectivelyOffline: isEffectivelyOffline(input),
  };
};
