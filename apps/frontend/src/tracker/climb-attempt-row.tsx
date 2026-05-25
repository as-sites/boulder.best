import { useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput as MantineTextInput,
} from '@mantine/core';
import { CheckIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { Checkbox, Textarea } from '@trendcapital/react-hook-form-mantine';
import { TimerDisplay } from '../components/timer/timer-display.js';
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
import { TimerControls } from './timer-controls.js';

interface ManualDurationInputProps {
  value: string;
  error: string | null;
  placeholder: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

const ManualDurationInput = ({
  value,
  error,
  placeholder,
  onChange,
  onCommit,
  onCancel,
}: ManualDurationInputProps) => (
  <MantineTextInput
    placeholder={placeholder}
    size="xs"
    w={86}
    value={value}
    error={error}
    aria-label="Duration (MM:SS)"
    onChange={(event) => {
      onChange(event.currentTarget.value);
    }}
    onBlur={onCommit}
    onKeyDown={(event) => {
      if (event.key === 'Enter') {
        onCommit();
      }
      if (event.key === 'Escape') {
        onCancel();
      }
    }}
  />
);

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
  const initialDurationValue = formatDurationMs(
    elapsedDurationMs(attempt.timer),
    {
      showMilliseconds: showTimerMilliseconds,
    },
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
    <Paper p="sm" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm">Attempt {attemptIndex + 1}</Text>
          <Group gap={6}>
            {isEditingManualDuration && canEditManualDuration ? (
              <ManualDurationInput
                value={manualDurationDraft}
                error={manualDurationError}
                placeholder={formatDurationMs(0, {
                  showMilliseconds: showTimerMilliseconds,
                })}
                onChange={(value) => {
                  setManualDurationDraft(value);
                  setManualDurationError(null);
                }}
                onCommit={commitManualDuration}
                onCancel={closeManualDurationEditor}
              />
            ) : (
              <TimerDisplay
                timer={attempt.timer}
                size="sm"
                showMilliseconds={showTimerMilliseconds}
              />
            )}
            {!isFinalized && canEditManualDuration ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                color={isEditingManualDuration ? 'green' : 'gray'}
                aria-label={
                  isEditingManualDuration ? 'Confirm duration' : 'Edit duration'
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
            ) : null}
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
          </Group>
        </Group>
        <Textarea<SessionFormValues>
          label="Attempt note"
          name={`${entryPath}.climbAttempts.${attemptIndex}.notes`}
          disabled={isFinalized}
          minRows={1}
        />
        <Checkbox<SessionFormValues>
          label="Completed"
          name={`${entryPath}.climbAttempts.${attemptIndex}.completed`}
          disabled={isFinalized}
        />
        {!isFinalized && canRemove ? (
          <Button
            size="compact-xs"
            variant="subtle"
            color="red"
            onClick={onRemove}
          >
            Remove attempt
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
};
