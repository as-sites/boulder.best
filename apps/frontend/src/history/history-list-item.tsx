import {
  Badge,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  CaretRightIcon,
  ClockIcon,
  ListBulletsIcon,
  MapPinIcon,
  TimerIcon,
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { formatDurationMs } from '../lib/timer/index.js';
import { formatSessionDate } from './format-session-date.js';
import type { MergedHistoryItem } from './merge-session-history.js';

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
      styles={{
        root: {
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '&:hover': {
            borderColor: 'var(--mantine-color-default-border)',
            boxShadow: 'var(--mantine-shadow-xs)',
          },
        },
      }}
    >
      <Group align="flex-start" justify="space-between" wrap="nowrap">
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Group align="flex-start" justify="space-between" wrap="nowrap">
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600} lineClamp={1}>
                {item.gymName}
              </Text>
              {item.location ? (
                <Group gap={4} wrap="nowrap">
                  <MapPinIcon aria-hidden size={14} />
                  <Text c="dimmed" lineClamp={1} size="sm">
                    {item.location}
                  </Text>
                </Group>
              ) : null}
            </Stack>
            <Group gap={6} wrap="nowrap">
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
          </Group>

          <Group gap="md" wrap="wrap">
            <Group gap={6} wrap="nowrap">
              <ThemeIcon color="gray" radius="xl" size="sm" variant="light">
                <ClockIcon aria-hidden size={14} />
              </ThemeIcon>
              <Text c="dimmed" size="sm">
                {formatSessionDate(item.startTime)}
              </Text>
            </Group>
            <Group gap={6} wrap="nowrap">
              <ThemeIcon color="gray" radius="xl" size="sm" variant="light">
                <TimerIcon aria-hidden size={14} />
              </ThemeIcon>
              <Text ff="monospace" size="sm">
                {formatDurationMs(item.totalDurationMs)}
              </Text>
            </Group>
            <Group gap={6} wrap="nowrap">
              <ThemeIcon color="gray" radius="xl" size="sm" variant="light">
                <ListBulletsIcon aria-hidden size={14} />
              </ThemeIcon>
              <Text c="dimmed" size="sm">
                {item.entryCount} {item.entryCount === 1 ? 'entry' : 'entries'}
              </Text>
            </Group>
          </Group>
        </Stack>

        <ThemeIcon
          aria-hidden
          color="gray"
          radius="xl"
          size="md"
          style={{ flexShrink: 0 }}
          variant="subtle"
        >
          <CaretRightIcon size={16} />
        </ThemeIcon>
      </Group>
    </Paper>
  </Stack>
);
