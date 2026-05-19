import { Button, Stack, Text } from '@mantine/core';
import {
  useSyncNow,
  useSyncQueueErrorCount,
  useSyncQueueLastError,
  useSyncQueuePendingCount,
} from '../offline/index.js';

export const SyncQueuePanel = () => {
  const pendingCount = useSyncQueuePendingCount();
  const errorCount = useSyncQueueErrorCount();
  const lastError = useSyncQueueLastError();
  const { canSyncNow, disabledReason, isSyncing, syncNow } = useSyncNow();

  return (
    <Stack gap="sm">
      <Text size="sm">
        Sync queue: {pendingCount} pending
        {errorCount > 0 ? `, ${errorCount} failed` : ''}.
      </Text>

      {lastError ? (
        <Text c="red" size="sm">
          Last error: {lastError}
        </Text>
      ) : null}

      {disabledReason ? (
        <Text c="dimmed" size="sm">
          {disabledReason}
        </Text>
      ) : null}

      <Button
        disabled={!canSyncNow}
        loading={isSyncing}
        onClick={() => {
          void syncNow();
        }}
      >
        Sync now
      </Button>
    </Stack>
  );
};
