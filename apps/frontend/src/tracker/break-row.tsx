import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { useWatch, type Control } from 'react-hook-form';
import { TimerDisplay } from '../components/timer/timer-display.js';
import { useTimerDisplayMilliseconds } from '../lib/settings/index.js';
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

  if (entry.type !== 'break') {
    return null;
  }

  const isBreakActive =
    entry.timer.status === 'running' || entry.timer.status === 'paused';

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Break</Text>
          <TimerDisplay
            timer={entry.timer}
            showMilliseconds={showTimerMilliseconds}
          />
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
