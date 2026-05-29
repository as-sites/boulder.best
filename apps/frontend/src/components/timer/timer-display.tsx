import { Text, type TextProps } from '@mantine/core';
import { formatDurationMs } from '../../lib/timer/index.js';
import type { TimerState } from '../../lib/timer/types.js';
import { useTimerDisplayMs } from './use-timer-display-ms.js';

export type TimerDisplayProps = Omit<TextProps, 'children'> & {
  timer: TimerState;
  showMilliseconds?: boolean;
};

/**
 * Renders elapsed time from timer state. Running timers tick via
 * requestAnimationFrame without touching form or context state.
 */
export const TimerDisplay = ({
  timer,
  showMilliseconds = false,
  ...textProps
}: TimerDisplayProps) => {
  const displayMs = useTimerDisplayMs(timer, showMilliseconds);

  return (
    <Text
      component="span"
      ff="monospace"
      aria-live={timer.status === 'running' ? 'polite' : 'off'}
      {...textProps}
    >
      {formatDurationMs(displayMs, { showMilliseconds })}
    </Text>
  );
};
