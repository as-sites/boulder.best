import type { SyncClimbAttempt } from '@boulder/api-contract';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import { formatDurationMs } from '../lib/timer/index.js';

export interface SessionDetailAttemptRowProps {
  attempt: SyncClimbAttempt;
  attemptNumber: number;
}

export const SessionDetailAttemptRow = ({
  attempt,
  attemptNumber,
}: SessionDetailAttemptRowProps) => {
  const isCompleted = attempt.completed === true;
  const notes = attempt.notes.trim();

  return (
    <Paper
      p="sm"
      withBorder
      {...(isCompleted
        ? {
            style: {
              borderColor: 'var(--mantine-color-green-6)',
            },
          }
        : {})}
    >
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap">
          <Badge
            color={isCompleted ? 'green' : 'gray'}
            leftSection={
              isCompleted ? (
                <CheckIcon aria-hidden size={12} weight="bold" />
              ) : null
            }
            size="md"
            variant="light"
          >
            Attempt {attemptNumber}
          </Badge>
          <Text ff="monospace" size="sm">
            {formatDurationMs(attempt.durationMs)}
          </Text>
        </Group>
        {notes ? (
          <Text c="dimmed" size="sm" style={{ overflowWrap: 'anywhere' }}>
            {notes}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
};
