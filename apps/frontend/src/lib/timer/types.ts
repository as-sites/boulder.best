/** Injectable clock for deterministic timer tests. */
export type TimerNow = () => Temporal.Instant;

export interface TimerState {
  accumulatedDurationMs: number;
  activeStartTime: string | null;
  status: 'idle' | 'running' | 'paused' | 'stopped';
}
