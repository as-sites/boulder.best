export interface SyncEligibilityInput {
  manualOfflineMode: boolean;
  isOnline: boolean;
  isAuthenticated: boolean;
}

/** Whether automatic sync/retry is allowed for the current app state. */
export const canAutoSync = ({
  manualOfflineMode,
  isOnline,
  isAuthenticated,
}: SyncEligibilityInput): boolean =>
  isAuthenticated && isOnline && !manualOfflineMode;

/** Whether the app should treat the device as offline for sync UX. */
export const isEffectivelyOffline = ({
  manualOfflineMode,
  isOnline,
}: Pick<SyncEligibilityInput, 'manualOfflineMode' | 'isOnline'>): boolean =>
  manualOfflineMode || !isOnline;
