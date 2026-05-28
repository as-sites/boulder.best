import { ActionIcon, Button, Group, Paper, Text } from '@mantine/core';
import { ArrowsClockwiseIcon, XIcon } from '@phosphor-icons/react';
import { useServiceWorkerUpdate } from '../lib/service-worker/index.js';

export const ServiceWorkerUpdateBanner = () => {
  const { needRefresh, update, dismiss } = useServiceWorkerUpdate();

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
          <Text size="sm" style={{ flexShrink: 1 }}>
            A new version of the app is available.
          </Text>
        </Group>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            leftSection={<ArrowsClockwiseIcon aria-hidden size={14} />}
            onClick={update}
            size="xs"
          >
            Update
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
