import { useState } from 'react';
import { ActionIcon, Badge, Box, Group, Paper, Stack } from '@mantine/core';
import {
  CheckIcon,
  ClockIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { Checkbox } from '@trendcapital/react-hook-form-mantine/Checkbox';
import { Textarea } from '@trendcapital/react-hook-form-mantine/Textarea';
import cx from 'clsx';
import { TimerDurationInput } from '../components/timer/timer-duration-input.js';
import {
  elapsedDurationMs,
  formatDurationMs,
  parseDurationInput,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from '../lib/timer/index.js';
import type {
  ClimbAttemptFormEntry,
  SessionFormValues,
  TimerState,
} from '../offline/db/types.js';
import classes from './climb-attempt-row.module.css';
import { TimerControls } from './timer-controls.js';

const TIMER_VALUE_ICON_SIZE = 16;

export interface ClimbAttemptRowProps {
  entryPath: `entries.${number}`;
  attemptIndex: number;
  attempt: ClimbAttemptFormEntry;
  isFinalized: boolean;
  showTimerMilliseconds: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onTimerChange: (attemptIndex: number, timer: TimerState) => void;
  onDurationMsChange: (attemptIndex: number, durationMs: number) => void;
}

export const ClimbAttemptRow = ({
  entryPath,
  attemptIndex,
  attempt,
  isFinalized,
  showTimerMilliseconds,
  canRemove,
  onRemove,
  onTimerChange,
  onDurationMsChange,
}: ClimbAttemptRowProps) => {
  const [isEditingManualDuration, setIsEditingManualDuration] = useState(false);
  const [manualDurationDraft, setManualDurationDraft] = useState('');
  const [manualDurationError, setManualDurationError] = useState<string | null>(
    null,
  );

  const canEditManualDuration =
    attempt.timer.status === 'idle' || attempt.timer.status === 'stopped';
  // Timer is always stopped/idle when editing is allowed, so this is stable.
  const initialDurationValue = formatDurationMs(
    elapsedDurationMs(attempt.timer),
    { showMilliseconds: showTimerMilliseconds },
  );

  const closeManualDurationEditor = () => {
    setIsEditingManualDuration(false);
    setManualDurationError(null);
  };

  const openManualDurationEditor = () => {
    setIsEditingManualDuration(true);
    setManualDurationDraft(initialDurationValue);
    setManualDurationError(null);
  };

  const commitManualDuration = () => {
    const trimmed = manualDurationDraft.trim();
    if (!trimmed || trimmed === initialDurationValue) {
      closeManualDurationEditor();
      return;
    }

    const durationMs = parseDurationInput(trimmed);
    if (durationMs === null) {
      setManualDurationError(
        'Enter time as M:SS or M:SS.mmm (e.g. 1:30 or 1:30.250)',
      );
      return;
    }

    onDurationMsChange(attemptIndex, durationMs);
    onTimerChange(attemptIndex, {
      status: 'stopped',
      accumulatedDurationMs: durationMs,
      activeStartTime: null,
    });
    closeManualDurationEditor();
  };

  return (
    <Paper
      p="sm"
      withBorder
      {...(attempt.completed
        ? {
            style: {
              borderColor: 'var(--mantine-color-green-6)',
            },
          }
        : {})}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Group gap={8} wrap="nowrap">
            <Badge
              variant="light"
              size="md"
              color={attempt.completed ? 'green' : 'gray'}
            >
              Attempt {attemptIndex + 1}
            </Badge>
            {!isFinalized && canRemove ? (
              <ActionIcon
                size="sm"
                variant="light"
                color="red"
                aria-label="Remove attempt"
                onClick={onRemove}
              >
                <TrashIcon aria-hidden size={16} />
              </ActionIcon>
            ) : null}
          </Group>
          <Checkbox<SessionFormValues>
            label="Completed"
            labelPosition="left"
            name={`${entryPath}.climbAttempts.${attemptIndex}.completed`}
            disabled={isFinalized}
          />
        </Group>

        <Textarea<SessionFormValues>
          label="Notes"
          placeholder="What happened on this attempt?"
          name={`${entryPath}.climbAttempts.${attemptIndex}.notes`}
          disabled={isFinalized}
          minRows={2}
          autosize
          maxRows={4}
        />

        <Box
          className={cx(classes.timerGrid)}
          style={{
            display: 'grid',
            gridTemplateColumns: '4fr 1.5fr 3fr',
            gap: 4,
            alignItems: 'center',
          }}
        >
          <TimerDurationInput
            timer={attempt.timer}
            size="sm"
            variant="filled"
            showMilliseconds={showTimerMilliseconds}
            aria-label={`Duration (M:SS${showTimerMilliseconds ? '.mmm' : ''})`}
            readOnly={!(isEditingManualDuration && canEditManualDuration)}
            value={
              isEditingManualDuration && canEditManualDuration
                ? manualDurationDraft
                : undefined
            }
            error={
              isEditingManualDuration
                ? (manualDurationError ?? undefined)
                : undefined
            }
            leftSection={<ClockIcon aria-hidden size={TIMER_VALUE_ICON_SIZE} />}
            rightSectionPointerEvents="all"
            rightSection={
              !isFinalized && canEditManualDuration ? (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isEditingManualDuration ? 'green' : 'gray'}
                  aria-label={
                    isEditingManualDuration
                      ? 'Confirm duration'
                      : 'Edit duration'
                  }
                  onMouseDown={(event) => {
                    if (isEditingManualDuration) {
                      event.preventDefault();
                    }
                  }}
                  onClick={() => {
                    if (isEditingManualDuration) {
                      commitManualDuration();
                      return;
                    }
                    openManualDurationEditor();
                  }}
                >
                  {isEditingManualDuration ? (
                    <CheckIcon aria-hidden size={14} />
                  ) : (
                    <PencilSimpleIcon aria-hidden size={14} />
                  )}
                </ActionIcon>
              ) : null
            }
            onChange={(event) => {
              if (!(isEditingManualDuration && canEditManualDuration)) {
                return;
              }
              setManualDurationDraft(event.currentTarget.value);
              setManualDurationError(null);
            }}
            onBlur={() => {
              if (isEditingManualDuration && canEditManualDuration) {
                commitManualDuration();
              }
            }}
            onKeyDown={(event) => {
              if (!(isEditingManualDuration && canEditManualDuration)) {
                return;
              }
              if (event.key === 'Enter') {
                commitManualDuration();
              }
              if (event.key === 'Escape') {
                closeManualDurationEditor();
              }
            }}
            onFocus={(event) => {
              if (!(isEditingManualDuration && canEditManualDuration)) {
                event.currentTarget.blur();
                return;
              }
              event.currentTarget.select();
            }}
          />

          {!isFinalized && !isEditingManualDuration ? (
            <TimerControls
              timer={attempt.timer}
              onStart={() => {
                onTimerChange(attemptIndex, startTimer(attempt.timer));
              }}
              onResume={() => {
                onTimerChange(attemptIndex, resumeTimer(attempt.timer));
              }}
              onPause={() => {
                onTimerChange(attemptIndex, pauseTimer(attempt.timer));
              }}
              onStop={() => {
                onTimerChange(attemptIndex, stopTimer(attempt.timer));
              }}
            />
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
};
