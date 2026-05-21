import { Stack, Text } from '@mantine/core';
import type { SessionFormValues } from '../offline/db/types.js';
import { sessionDisplayTimer } from '../tracker/session-form-state.js';
import { TimerDisplay } from './timer/timer-display.js';

export interface AppShellSessionTimerProps {
  compact?: boolean;
  formData: SessionFormValues;
}

export const AppShellSessionTimer = ({
  compact = false,
  formData,
}: AppShellSessionTimerProps) => {
  const timer = sessionDisplayTimer(formData);

  if (compact) {
    return (
      <TimerDisplay
        aria-label="Active session duration"
        data-testid="app-shell-session-timer"
        fw={600}
        size="sm"
        timer={timer}
      />
    );
  }

  return (
    <Stack
      aria-label="Active session duration"
      data-testid="app-shell-session-timer"
      gap={4}
    >
      <Text c="dimmed" fw={500} size="xs">
        Session
      </Text>
      <TimerDisplay fw={600} size="lg" timer={timer} />
    </Stack>
  );
};
