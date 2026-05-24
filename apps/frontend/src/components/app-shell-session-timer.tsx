import { Flex, Stack, Text } from '@mantine/core';
import { TimerIcon } from '@phosphor-icons/react';
import { useTimerDisplayMilliseconds } from '../lib/settings/index.js';
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
  const { enabled: showTimerMilliseconds } = useTimerDisplayMilliseconds();

  if (compact) {
    return (
      <Flex
        align="center"
        aria-label="Active session duration"
        data-testid="app-shell-session-timer"
        gap={6}
        wrap="nowrap"
      >
        <TimerIcon aria-hidden size={18} weight="duotone" />
        <TimerDisplay
          fw={600}
          size="sm"
          timer={timer}
          showMilliseconds={showTimerMilliseconds}
        />
      </Flex>
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
      <TimerDisplay
        fw={600}
        size="lg"
        timer={timer}
        showMilliseconds={showTimerMilliseconds}
      />
    </Stack>
  );
};
