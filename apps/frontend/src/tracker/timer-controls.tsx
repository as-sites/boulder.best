import { Button } from '@mantine/core';
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

  const iconSize = 16;

  return (
    <>
      {timer.status === 'idle' ? (
        <Button
          size="sm"
          variant="light"
          leftSection={<PlayIcon aria-hidden size={iconSize} />}
          onClick={onStart}
        >
          Start
        </Button>
      ) : null}
      {timer.status === 'running' ? (
        <Button
          size="sm"
          px={10}
          variant="light"
          aria-label="Pause timer"
          onClick={onPause}
        >
          <PauseIcon aria-hidden size={iconSize} />
        </Button>
      ) : null}
      {timer.status === 'paused' ? (
        <Button
          size="sm"
          px={10}
          variant="light"
          aria-label="Resume timer"
          onClick={onResume}
        >
          <PlayIcon aria-hidden size={iconSize} />
        </Button>
      ) : null}
      {timer.status === 'running' || timer.status === 'paused' ? (
        <Button
          size="sm"
          variant="light"
          color="red"
          leftSection={<StopIcon aria-hidden size={iconSize} />}
          onClick={onStop}
        >
          Stop
        </Button>
      ) : null}
    </>
  );
};
