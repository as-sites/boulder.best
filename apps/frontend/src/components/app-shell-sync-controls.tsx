import { Badge, Button, Group } from '@mantine/core';
import {
  useSyncNow,
  useSyncQueueErrorCount,
  useSyncQueuePendingCount,
} from '../offline/index.js';

export const AppShellSyncControls = () => {
  const pendingCount = useSyncQueuePendingCount();
  const errorCount = useSyncQueueErrorCount();
  const { canSyncNow, isSyncing, syncNow } = useSyncNow();

  const statusLabel =
    errorCount > 0
      ? `${pendingCount} pending, ${errorCount} failed`
      : `${pendingCount} pending`;

  return (
    <Group data-testid="app-shell-sync-controls" gap="xs" wrap="nowrap">
      <Badge
        color={errorCount > 0 ? 'red' : pendingCount > 0 ? 'yellow' : 'gray'}
        variant="light"
      >
        {statusLabel}
      </Badge>
      <Button
        disabled={!canSyncNow}
        loading={isSyncing}
        onClick={() => {
          void syncNow();
        }}
        size="xs"
      >
        Sync now
      </Button>
    </Group>
  );
};
