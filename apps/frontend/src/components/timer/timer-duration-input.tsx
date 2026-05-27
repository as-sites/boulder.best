import { useEffect, useEffectEvent, useState } from 'react';
import { elapsedDurationMs, formatDurationMs } from '../../lib/timer/index.js';
import type { TimerState } from '../../lib/timer/types.js';
import { DurationInput, type DurationInputProps } from '../duration-input.js';

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
  const [displayMs, setDisplayMs] = useState(() => elapsedDurationMs(timer));
  const readElapsedMs = useEffectEvent(() => elapsedDurationMs(timer));

  useEffect(() => {
    if (timer.status !== 'running') {
      setDisplayMs(readElapsedMs());
      return;
    }
    let frameId = 0;
    const tick = () => {
      const newMs = readElapsedMs();
      setDisplayMs((prev) => {
        if (showMilliseconds) {
          return newMs !== prev ? newMs : prev;
        }
        return Math.floor(newMs / 1000) !== Math.floor(prev / 1000)
          ? newMs
          : prev;
      });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    timer.status,
    timer.accumulatedDurationMs,
    timer.activeStartTime,
    showMilliseconds,
  ]);

  return (
    <DurationInput
      value={value ?? formatDurationMs(displayMs, { showMilliseconds })}
      withMilliseconds={showMilliseconds}
      {...rest}
    />
  );
};
