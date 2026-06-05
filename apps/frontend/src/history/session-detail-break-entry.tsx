import type { SessionDetailBreakEntry } from '@boulder/api-contract';
import { Group, Paper, Text } from '@mantine/core';
import { CoffeeIcon } from '@phosphor-icons/react';
import { formatDurationMs } from '../lib/timer/index.js';

export interface SessionDetailBreakEntryCardProps {
  entry: SessionDetailBreakEntry;
}

export const SessionDetailBreakEntryCard = ({
  entry,
}: SessionDetailBreakEntryCardProps) => (
  <Paper bg="var(--mantine-color-default-hover)" p="md" withBorder>
    <Group justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <CoffeeIcon aria-hidden size={18} />
        <Text fw={600}>Break</Text>
      </Group>
      <Text ff="monospace" size="sm">
        {formatDurationMs(entry.durationMs)}
      </Text>
    </Group>
  </Paper>
);
