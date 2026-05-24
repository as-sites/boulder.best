import { ActionIcon, Button, Group } from '@mantine/core';
import { PauseIcon, PlayIcon, StopIcon } from '@phosphor-icons/react';
import type { TimerState } from '../lib/timer/types.js';

export interface TimerControlsProps {
  timer: TimerState;
  disabled?: boolean;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  onStop: () => void;
}

export const TimerControls = ({
  timer,
  disabled = false,
  onStart,
  onResume,
  onPause,
  onStop,
}: TimerControlsProps) => {
  if (disabled || timer.status === 'stopped') {
    return null;
  }

  return (
    <Group gap={4}>
      {timer.status === 'idle' ? (
        <Button
          size="compact-xs"
          variant="light"
          leftSection={<PlayIcon aria-hidden size={14} />}
          onClick={onStart}
        >
          Start
        </Button>
      ) : null}
      {timer.status === 'running' ? (
        <ActionIcon
          size="sm"
          variant="light"
          aria-label="Pause timer"
          onClick={onPause}
        >
          <PauseIcon aria-hidden size={14} />
        </ActionIcon>
      ) : null}
      {timer.status === 'paused' ? (
        <ActionIcon
          size="sm"
          variant="light"
          aria-label="Resume timer"
          onClick={onResume}
        >
          <PlayIcon aria-hidden size={14} />
        </ActionIcon>
      ) : null}
      {timer.status === 'running' || timer.status === 'paused' ? (
        <Button
          size="compact-xs"
          variant="light"
          color="red"
          leftSection={<StopIcon aria-hidden size={14} />}
          onClick={onStop}
        >
          Stop
        </Button>
      ) : null}
    </Group>
  );
};
