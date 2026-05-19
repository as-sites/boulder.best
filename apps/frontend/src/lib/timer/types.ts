/** Injectable clock for deterministic timer tests. */
export type TimerNow = () => Temporal.Instant;

export type TimerState =
  | {
      status: 'idle' | 'paused' | 'stopped';
      accumulatedDurationMs: number;
      activeStartTime: null;
    }
  | {
      status: 'running';
      accumulatedDurationMs: number;
      activeStartTime: string;
    };
