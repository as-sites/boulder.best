import { useSyncExternalStore } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import {
  canAutoSync,
  isEffectivelyOffline,
  type SyncEligibilityInput,
} from './sync-eligibility.js';

const MANUAL_OFFLINE_STORAGE_KEY = 'boulder.manualOfflineMode';
const TIMER_MILLISECONDS_STORAGE_KEY = 'boulder.timerDisplayMilliseconds';
const AUTO_REST_ENABLED_STORAGE_KEY = 'boulder.autoRestEnabled';
const AUTO_REST_DURATION_MINUTES_STORAGE_KEY =
  'boulder.autoRestDurationMinutes';

export const AUTO_REST_DURATION_MIN_MINUTES = 1;
export const AUTO_REST_DURATION_MAX_MINUTES = 60;
export const AUTO_REST_DURATION_DEFAULT_MINUTES = 5;

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

export const useAutoRestTiming = () => {
  const [enabled, setEnabled] = useLocalStorage<boolean>({
    key: AUTO_REST_ENABLED_STORAGE_KEY,
    defaultValue: false,
  });
  const [durationMinutes, setDurationMinutes] = useLocalStorage<number>({
    key: AUTO_REST_DURATION_MINUTES_STORAGE_KEY,
    defaultValue: AUTO_REST_DURATION_DEFAULT_MINUTES,
  });

  return {
    enabled,
    setEnabled,
    durationMinutes,
    setDurationMinutes,
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
