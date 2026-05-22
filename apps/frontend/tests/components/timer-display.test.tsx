import { afterEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from '../../src/components/timer/timer-display.js';
import {
  createIdleTimer,
  pauseTimer,
  startTimer,
  stopTimer,
  type TimerNow,
} from '../../src/lib/timer/index.js';

const fixedNow =
  (epochMs: number): TimerNow =>
  () =>
    Temporal.Instant.fromEpochMilliseconds(epochMs);

const renderTimer = (
  timer: Parameters<typeof TimerDisplay>[0]['timer'],
  showMilliseconds = false,
) =>
  render(
    <MantineProvider>
      <TimerDisplay
        timer={timer}
        data-testid="timer"
        showMilliseconds={showMilliseconds}
      />
    </MantineProvider>,
  );

describe(TimerDisplay, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders idle timers as 0:00 without animation frames', () => {
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame');

    renderTimer(createIdleTimer());

    expect(screen.getByTestId('timer')).toHaveTextContent('0:00');
    expect(raf).not.toHaveBeenCalled();
  });

  it('renders stopped timers statically from accumulated duration', () => {
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame');
    const stopped = stopTimer(
      startTimer(createIdleTimer(), fixedNow(0)),
      fixedNow(125_000),
    );

    renderTimer(stopped);

    expect(screen.getByTestId('timer')).toHaveTextContent('2:05');
    expect(raf).not.toHaveBeenCalled();
  });

  it('renders paused timers statically without scheduling frames', () => {
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame');
    const started = startTimer(createIdleTimer(), fixedNow(0));
    const paused = pauseTimer(started, fixedNow(90_000));

    renderTimer(paused);

    expect(screen.getByTestId('timer')).toHaveTextContent('1:30');
    expect(raf).not.toHaveBeenCalled();
  });

  it('renders optional millisecond precision', () => {
    const stopped = stopTimer(
      startTimer(createIdleTimer(), fixedNow(0)),
      fixedNow(65_123),
    );

    renderTimer(stopped, true);

    expect(screen.getByTestId('timer')).toHaveTextContent('1:05.123');
  });

  it('schedules animation frames while running', () => {
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame');
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame');
    const running = startTimer(createIdleTimer(), fixedNow(0));

    const { unmount } = renderTimer(running);

    expect(raf).toHaveBeenCalled();
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
