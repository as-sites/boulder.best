import { ActionIcon, Group } from '@mantine/core';
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
    <Group gap="xs">
      {timer.status === 'idle' ? (
        <ActionIcon
          size="sm"
          variant="light"
          aria-label="Start timer"
          onClick={onStart}
        >
          <PlayIcon aria-hidden size={14} />
        </ActionIcon>
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
        <ActionIcon
          size="sm"
          variant="light"
          color="red"
          aria-label="Stop timer"
          onClick={onStop}
        >
          <StopIcon aria-hidden size={14} />
        </ActionIcon>
      ) : null}
    </Group>
  );
};
