import { useEffect, useEffectEvent, useState } from 'react';
import { Text, type TextProps } from '@mantine/core';
import { elapsedDurationMs, formatDurationMs } from '../../lib/timer/index.js';
import type { TimerState } from '../../lib/timer/types.js';

export type TimerDisplayProps = Omit<TextProps, 'children'> & {
  timer: TimerState;
};

/**
 * Renders elapsed time from timer state. Running timers tick via
 * requestAnimationFrame without touching form or context state.
 */
export const TimerDisplay = ({ timer, ...textProps }: TimerDisplayProps) => {
  const [displayMs, setDisplayMs] = useState(() => elapsedDurationMs(timer));
  const readElapsedMs = useEffectEvent(() => elapsedDurationMs(timer));

  useEffect(() => {
    if (timer.status !== 'running') {
      setDisplayMs(readElapsedMs());
      return;
    }

    let frameId = 0;

    const tick = () => {
      setDisplayMs(readElapsedMs());
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [timer.status, timer.accumulatedDurationMs, timer.activeStartTime]);

  return (
    <Text
      component="span"
      ff="monospace"
      aria-live={timer.status === 'running' ? 'polite' : 'off'}
      {...textProps}
    >
      {formatDurationMs(displayMs)}
    </Text>
  );
};
