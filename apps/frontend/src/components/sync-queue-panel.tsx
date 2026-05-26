import { useState } from 'react';
import {
  Anchor,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  buildFailedSyncSupportMailto,
  FAILED_SYNC_SUPPORT_BLURB,
} from '../lib/support.js';
import type { SyncQueueItem } from '../offline/db/types.js';
import {
  clearFailedSyncQueueItem,
  downloadFailedSyncExport,
  useSyncNow,
  useSyncQueueErrorCount,
  useSyncQueueErrorList,
  useSyncQueueLastError,
  useSyncQueuePendingCount,
} from '../offline/index.js';

const formatQueueTimestamp = (epochMs: number): string =>
  new Date(epochMs).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const FailedSyncQueueItemRow = ({ item }: { item: SyncQueueItem }) => {
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );

  const handleDownload = async (): Promise<void> => {
    setIsExporting(true);
    try {
      await downloadFailedSyncExport(item);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySupportBlurb = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(FAILED_SYNC_SUPPORT_BLURB);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const handleClear = async (): Promise<void> => {
    setIsClearing(true);
    try {
      await clearFailedSyncQueueItem(item);
      closeConfirm();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            Session {item.sessionId}
          </Text>
          <Text c="red" size="sm">
            {item.lastError ?? 'Sync failed with no error message.'}
          </Text>
          <Text c="dimmed" size="xs">
            Retries: {item.retryCount} · Updated{' '}
            {formatQueueTimestamp(item.updatedAt)}
          </Text>
          <Text c="dimmed" size="xs">
            JSON export includes session data and image metadata only — photo
            files stay on this device and are not included.
          </Text>
          <Group gap="xs">
            <Button
              loading={isExporting}
              onClick={() => {
                void handleDownload();
              }}
              size="xs"
              variant="light"
            >
              Download JSON
            </Button>
            <Button
              onClick={() => {
                void handleCopySupportBlurb();
              }}
              size="xs"
              variant="default"
            >
              Copy support note
            </Button>
            <Anchor
              href={buildFailedSyncSupportMailto(item.sessionId)}
              size="xs"
            >
              Email support
            </Anchor>
            <Button color="red" onClick={openConfirm} size="xs" variant="light">
              Clear from device
            </Button>
          </Group>
          {copyStatus === 'copied' ? (
            <Text c="dimmed" size="xs">
              Support note copied to clipboard.
            </Text>
          ) : null}
          {copyStatus === 'failed' ? (
            <Text c="red" size="xs">
              Could not copy to clipboard on this browser.
            </Text>
          ) : null}
        </Stack>
      </Paper>

      <Modal
        centered
        onClose={closeConfirm}
        opened={confirmOpened}
        title="Remove failed sync from this device?"
        transitionProps={{ duration: 0 }}
      >
        <Stack gap="md">
          <Text size="sm">
            This removes the failed sync entry and any offline photos for this
            session from IndexedDB on this device. The data cannot be re-synced
            automatically. Export the JSON first if you want the maintainer to
            recover it manually.
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeConfirm} variant="default">
              Cancel
            </Button>
            <Button
              color="red"
              loading={isClearing}
              onClick={() => {
                void handleClear();
              }}
            >
              Clear from device
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export const SyncQueuePanel = () => {
  const pendingCount = useSyncQueuePendingCount();
  const errorCount = useSyncQueueErrorCount();
  const failedItems = useSyncQueueErrorList();
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

      {failedItems.length > 0 ? (
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Failed syncs
          </Text>
          {failedItems.map((item) => (
            <FailedSyncQueueItemRow item={item} key={item.id} />
          ))}
        </Stack>
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
