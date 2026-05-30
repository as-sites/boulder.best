import { formatDurationMs } from '../../lib/timer/index.js';
import type { TimerState } from '../../lib/timer/types.js';
import { DurationInput, type DurationInputProps } from '../duration-input.js';
import { useTimerDisplayMs } from './use-timer-display-ms.js';

export interface TimerDurationInputProps extends Omit<
  DurationInputProps,
  'withMilliseconds'
> {
  timer: TimerState;
  /** Mirror of DurationInput's withMilliseconds; also controls tick granularity */
  showMilliseconds?: boolean;
}

/**
 * A DurationInput that ticks automatically while the timer is running. Mirrors
 * TimerDisplay's RAF loop: updates once per second without milliseconds, or
 * every frame when showMilliseconds is true.
 *
 * Pass `value` to override the live display (e.g. a draft string during manual
 * editing).
 */
export const TimerDurationInput = ({
  timer,
  showMilliseconds = false,
  value,
  ...rest
}: TimerDurationInputProps) => {
  const displayMs = useTimerDisplayMs(timer, showMilliseconds);

  return (
    <DurationInput
      value={value ?? formatDurationMs(displayMs, { showMilliseconds })}
      withMilliseconds={showMilliseconds}
      {...rest}
    />
  );
};
