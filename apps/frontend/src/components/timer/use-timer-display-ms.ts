import { useEffect, useEffectEvent, useState } from 'react';
import { elapsedDurationMs } from '../../lib/timer/index.js';
import type { TimerState } from '../../lib/timer/types.js';

/**
 * Returns the elapsed milliseconds for a timer, ticking via
 * requestAnimationFrame while the timer is running.
 *
 * Re-renders are batched: without showMilliseconds only one re-render fires per
 * elapsed second; with it every frame is emitted.
 */
export const useTimerDisplayMs = (
  timer: TimerState,
  showMilliseconds = false,
): number => {
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
      // Only trigger a re-render when the displayed second changes; the text
      // output of formatDurationMs is identical within the same second.
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

  return displayMs;
};
