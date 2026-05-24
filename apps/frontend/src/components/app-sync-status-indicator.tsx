import { Box, ThemeIcon } from '@mantine/core';
import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {
  useSyncNow,
  useSyncQueueErrorCount,
  useSyncQueuePendingCount,
} from '../offline/index.js';

export type AppSyncStatus = 'synced' | 'pending' | 'error';

export const resolveAppSyncStatus = (
  pendingCount: number,
  errorCount: number,
): AppSyncStatus => {
  if (errorCount > 0) {
    return 'error';
  }
  if (pendingCount > 0) {
    return 'pending';
  }
  return 'synced';
};

const statusConfig = {
  synced: {
    color: 'green',
    icon: CheckCircleIcon,
    label: 'All sessions synced',
    avatarStyle: {
      backgroundColor:
        'light-dark(var(--mantine-color-green-filled), var(--mantine-color-green-5))',
      color: 'var(--mantine-color-white)',
    },
  },
  pending: {
    color: 'yellow',
    icon: CloudArrowUpIcon,
    label: 'Sessions waiting to sync',
    avatarStyle: {
      backgroundColor:
        'light-dark(var(--mantine-color-yellow-5), var(--mantine-color-yellow-3))',
      color: 'var(--mantine-color-black)',
    },
  },
  error: {
    color: 'red',
    icon: WarningCircleIcon,
    label: 'Sync errors need attention',
    avatarStyle: {
      backgroundColor:
        'light-dark(var(--mantine-color-red-filled), var(--mantine-color-red-5))',
      color: 'var(--mantine-color-white)',
    },
  },
} as const;

const AVATAR_BADGE_SIZE = 22;
const AVATAR_BADGE_ICON_SIZE = 13;

export const useAppSyncStatus = (): AppSyncStatus => {
  const pendingCount = useSyncQueuePendingCount();
  const errorCount = useSyncQueueErrorCount();
  return resolveAppSyncStatus(pendingCount, errorCount);
};

export interface AppSyncStatusIndicatorProps {
  /** When true, shows a compact badge on the avatar corner. */
  onAvatar?: boolean;
}

export const AppSyncStatusIndicator = ({
  onAvatar = false,
}: AppSyncStatusIndicatorProps) => {
  const pendingCount = useSyncQueuePendingCount();
  const errorCount = useSyncQueueErrorCount();
  const { isSyncing } = useSyncNow();
  const status = resolveAppSyncStatus(pendingCount, errorCount);
  const { color, icon: Icon, label, avatarStyle } = statusConfig[status];

  const statusLabel = isSyncing
    ? 'Syncing sessions'
    : status === 'pending'
      ? `${pendingCount} session${pendingCount === 1 ? '' : 's'} waiting to sync`
      : status === 'error'
        ? `${errorCount} sync error${errorCount === 1 ? '' : 's'}`
        : label;

  if (onAvatar) {
    return (
      <Box
        aria-label={statusLabel}
        data-testid="app-sync-status-indicator"
        data-sync-status={status}
        pos="absolute"
        right={0}
        bottom={0}
        style={{
          transform: 'translate(25%, 25%)',
          pointerEvents: 'none',
        }}
      >
        <ThemeIcon
          aria-hidden
          radius="xl"
          size={AVATAR_BADGE_SIZE}
          style={{
            ...avatarStyle,
            border: '2.5px solid var(--mantine-color-body)',
            boxShadow: '0 0 0 1px var(--mantine-color-default-border)',
          }}
          variant="filled"
        >
          <Icon size={AVATAR_BADGE_ICON_SIZE} weight="bold" />
        </ThemeIcon>
      </Box>
    );
  }

  return (
    <ThemeIcon
      aria-label={statusLabel}
      color={color}
      data-testid="app-sync-status-indicator"
      data-sync-status={status}
      radius="xl"
      size="sm"
      variant="light"
    >
      <Icon size={14} weight="fill" />
    </ThemeIcon>
  );
};
