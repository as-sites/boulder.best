import { ActionIcon, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { ArrowsClockwiseIcon, XIcon } from '@phosphor-icons/react';
import {
  formatVersion,
  LOADED_VERSION,
  useLatestVersion,
} from '../lib/app-version.js';
import { useServiceWorkerUpdate } from '../lib/service-worker/index.js';

export const ServiceWorkerUpdateBanner = () => {
  const { needRefresh, update, dismiss } = useServiceWorkerUpdate();
  const latestVersion = useLatestVersion();
  const loadedShort = formatVersion(LOADED_VERSION);
  const latestShort = latestVersion ? formatVersion(latestVersion) : null;

  if (!needRefresh) {
    return null;
  }

  return (
    <Paper
      withBorder
      p="sm"
      radius={0}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10_000,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
      }}
    >
      <Group gap="sm" justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: '1 1 auto', minWidth: 0 }}>
          <ArrowsClockwiseIcon
            aria-hidden
            size={18}
            style={{ flexShrink: 0 }}
          />
          <Stack gap={2} style={{ flexShrink: 1, minWidth: 0 }}>
            <Text size="sm">
              A new version has been downloaded. Reload to apply it.
            </Text>
            {latestShort && (
              <Text c="dimmed" ff="monospace" size="xs">
                Version: {loadedShort} → {latestShort}
              </Text>
            )}
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            leftSection={<ArrowsClockwiseIcon aria-hidden size={14} />}
            onClick={update}
            size="xs"
          >
            Reload
          </Button>
          <ActionIcon
            aria-label="Dismiss update notification"
            onClick={dismiss}
            size="sm"
            variant="subtle"
          >
            <XIcon aria-hidden size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
};
