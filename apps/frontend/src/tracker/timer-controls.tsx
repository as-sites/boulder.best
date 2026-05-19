import { Button, Group } from '@mantine/core';
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
        <Button size="compact-xs" variant="light" onClick={onStart}>
          Start
        </Button>
      ) : null}
      {timer.status === 'running' ? (
        <Button size="compact-xs" variant="light" onClick={onPause}>
          Pause
        </Button>
      ) : null}
      {timer.status === 'paused' ? (
        <Button size="compact-xs" variant="light" onClick={onResume}>
          Resume
        </Button>
      ) : null}
      {timer.status === 'running' || timer.status === 'paused' ? (
        <Button size="compact-xs" variant="light" color="red" onClick={onStop}>
          Stop
        </Button>
      ) : null}
    </Group>
  );
};
