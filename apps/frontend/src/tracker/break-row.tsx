import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { useWatch, type Control } from 'react-hook-form';
import { TimerDisplay } from '../components/timer/timer-display.js';
import {
  useAutoRestTiming,
  useTimerDisplayMilliseconds,
} from '../lib/settings/index.js';
import { formatDurationMs } from '../lib/timer/index.js';
import type { SessionFormValues } from '../offline/db/types.js';

export interface BreakRowProps {
  control: Control<SessionFormValues>;
  index: number;
  isFinalized: boolean;
  onEndBreak: () => void;
  onRemove: () => void;
}

export const BreakRow = ({
  control,
  index,
  isFinalized,
  onEndBreak,
  onRemove,
}: BreakRowProps) => {
  const entry = useWatch({ control, name: `entries.${index}` });
  const { enabled: showTimerMilliseconds } = useTimerDisplayMilliseconds();
  const { enabled: autoRestEnabled, durationMinutes: autoRestDurationMinutes } =
    useAutoRestTiming();

  if (entry.type !== 'break') {
    return null;
  }

  const isBreakActive =
    entry.timer.status === 'running' || entry.timer.status === 'paused';

  const targetDurationMs = autoRestEnabled
    ? autoRestDurationMinutes * 60_000
    : null;
  const targetLabel =
    targetDurationMs !== null
      ? formatDurationMs(targetDurationMs, { showMilliseconds: false })
      : null;

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Break</Text>
          <Group gap="xs">
            <TimerDisplay
              timer={entry.timer}
              showMilliseconds={showTimerMilliseconds}
            />
            {targetLabel !== null ? (
              <Text c="dimmed" ff="monospace">
                / {targetLabel}
              </Text>
            ) : null}
          </Group>
        </Group>

        {!isFinalized && isBreakActive ? (
          <Button size="compact-sm" onClick={onEndBreak}>
            End break
          </Button>
        ) : null}

        {!isFinalized ? (
          <Button
            size="compact-sm"
            variant="subtle"
            color="red"
            onClick={onRemove}
          >
            Remove break
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
};
