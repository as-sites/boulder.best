import { Badge, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { formatDurationMs } from '../lib/timer/index.js';
import type { MergedHistoryItem } from './merge-session-history.js';

const formatSessionDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export interface HistoryListItemProps {
  item: MergedHistoryItem;
  showLocalSeparator?: boolean;
}

export const HistoryListItem = ({
  item,
  showLocalSeparator = false,
}: HistoryListItemProps) => (
  <Stack gap="xs">
    {showLocalSeparator ? (
      <Divider label="On this device" labelPosition="left" />
    ) : null}

    <Paper
      component={Link}
      p="md"
      radius="md"
      to={`/history/${item.id}`}
      withBorder
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={600}>{item.gymName}</Text>
          {item.syncStatus === 'pending' ? (
            <Badge color="yellow" variant="light">
              Pending sync
            </Badge>
          ) : null}
          {item.syncStatus === 'error' ? (
            <Badge color="red" variant="light">
              Sync failed
            </Badge>
          ) : null}
        </Group>

        <Text c="dimmed" size="sm">
          {formatSessionDate(item.startTime)}
        </Text>

        <Group gap="md">
          <Text size="sm">{formatDurationMs(item.totalDurationMs)}</Text>
          <Text c="dimmed" size="sm">
            {item.entryCount} {item.entryCount === 1 ? 'entry' : 'entries'}
          </Text>
        </Group>
      </Stack>
    </Paper>
  </Stack>
);
