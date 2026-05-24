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
import {
  Checkbox,
  Select,
  TextInput,
  Textarea,
} from '@trendcapital/react-hook-form-mantine';
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
} from 'react-hook-form';
import { TimerDisplay } from '../components/timer/timer-display.js';
import { useTimerDisplayMilliseconds } from '../lib/settings/index.js';
import {
  elapsedDurationMs,
  formatDurationMs,
  parseDurationInput,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from '../lib/timer/index.js';
import type { SessionFormValues } from '../offline/db/types.js';
import { ClimbPhotoAttachments } from './climb-photo-attachments.js';
import { confirmRemoval } from './confirm-removal.js';
import { createClimbAttempt } from './entry-factory.js';
import { TimerControls } from './timer-controls.js';

interface ManualDurationInputProps {
  value: string;
  error: string | null;
  placeholder: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

/** Inline duration editor for MM:SS(.mmm) style manual entry. */
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

export interface ClimbRowProps {
  control: Control<SessionFormValues>;
  index: number;
  sessionId: string;
  grades: string[];
  isFinalized: boolean;
  defaultName: string;
  onRemove: () => void;
}

export const ClimbRow = ({
  control,
  index,
  sessionId,
  grades,
  isFinalized,
  defaultName,
  onRemove,
}: ClimbRowProps) => {
  const { setValue, getValues } = useFormContext<SessionFormValues>();
  const { enabled: showTimerMilliseconds } = useTimerDisplayMilliseconds();
  const [editingAttemptIndex, setEditingAttemptIndex] = useState<number | null>(
    null,
  );
  const [manualDurationDraft, setManualDurationDraft] = useState('');
  const [manualDurationError, setManualDurationError] = useState<string | null>(
    null,
  );
  const entryPath = `entries.${index}` as const;
  const climb = useWatch({ control, name: entryPath });

  const attemptsField = useFieldArray({
    control,
    name: `entries.${index}.climbAttempts`,
  });

  if (climb.type !== 'climb') {
    return null;
  }

  const updateAttemptTimer = (
    attemptIndex: number,
    timer: (typeof climb.climbAttempts)[number]['timer'],
  ) => {
    setValue(`${entryPath}.climbAttempts.${attemptIndex}.timer`, timer, {
      shouldDirty: true,
    });
  };

  const handleRemoveAttempt = (attemptIndex: number) => {
    const attempt = climb.climbAttempts[attemptIndex];
    if (!attempt) {
      return;
    }

    const needsConfirm =
      attempt.timer.status === 'running' ||
      attempt.timer.status === 'paused' ||
      Boolean(attempt.notes.trim());

    if (needsConfirm && !confirmRemoval('Remove this attempt?')) {
      return;
    }

    attemptsField.remove(attemptIndex);
    if (editingAttemptIndex === attemptIndex) {
      setEditingAttemptIndex(null);
    }
    const reordered = getValues(`${entryPath}.climbAttempts`).map(
      (item, sequenceOrder) => ({ ...item, sequenceOrder }),
    );
    setValue(`${entryPath}.climbAttempts`, reordered, { shouldDirty: true });
  };

  const handleAddAttempt = () => {
    const nextOrder = climb.climbAttempts.length;
    attemptsField.append(createClimbAttempt(nextOrder));
  };

  const closeManualDurationEditor = () => {
    setEditingAttemptIndex(null);
    setManualDurationError(null);
  };

  const openManualDurationEditor = (
    attemptIndex: number,
    timer: (typeof climb.climbAttempts)[number]['timer'],
  ) => {
    setEditingAttemptIndex(attemptIndex);
    setManualDurationDraft(
      formatDurationMs(elapsedDurationMs(timer), {
        showMilliseconds: showTimerMilliseconds,
      }),
    );
    setManualDurationError(null);
  };

  const commitManualDuration = (attemptIndex: number, initialValue: string) => {
    const trimmed = manualDurationDraft.trim();
    if (!trimmed || trimmed === initialValue) {
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
    setValue(
      `${entryPath}.climbAttempts.${attemptIndex}.durationMs`,
      durationMs,
      {
        shouldDirty: true,
      },
    );
    updateAttemptTimer(attemptIndex, {
      status: 'stopped',
      accumulatedDurationMs: durationMs,
      activeStartTime: null,
    });
    closeManualDurationEditor();
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>{climb.name || defaultName}</Text>
        </Group>

        <TextInput<SessionFormValues>
          label="Name"
          name={`${entryPath}.name`}
          disabled={isFinalized}
          placeholder={defaultName}
        />

        <Select<SessionFormValues>
          label="Grade"
          name={`${entryPath}.grade`}
          disabled={isFinalized}
          comboboxProps={{ withinPortal: false }}
          data={grades}
          clearable
          searchable
          onChange={(grade) => {
            setValue(`${entryPath}.grade`, grade ?? '', { shouldDirty: true });
          }}
        />

        <Textarea<SessionFormValues>
          label="Climb notes"
          name={`${entryPath}.notes`}
          disabled={isFinalized}
          minRows={2}
        />

        <ClimbPhotoAttachments
          sessionId={sessionId}
          entryId={climb.id}
          disabled={isFinalized}
        />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Attempts
          </Text>
          {climb.climbAttempts.map((attempt, attemptIndex) => {
            const canEditManualDuration =
              attempt.timer.status === 'idle' ||
              attempt.timer.status === 'stopped';
            const isEditingManualDuration =
              canEditManualDuration && editingAttemptIndex === attemptIndex;
            const initialDurationValue = formatDurationMs(
              elapsedDurationMs(attempt.timer),
              {
                showMilliseconds: showTimerMilliseconds,
              },
            );

            return (
              <Paper key={attemptIndex} p="sm" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">Attempt {attemptIndex + 1}</Text>
                    <Group gap={6}>
                      {isEditingManualDuration ? (
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
                          onCommit={() => {
                            commitManualDuration(
                              attemptIndex,
                              initialDurationValue,
                            );
                          }}
                          onCancel={() => {
                            closeManualDurationEditor();
                          }}
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
                              commitManualDuration(
                                attemptIndex,
                                initialDurationValue,
                              );
                              return;
                            }
                            openManualDurationEditor(
                              attemptIndex,
                              attempt.timer,
                            );
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
                            updateAttemptTimer(
                              attemptIndex,
                              startTimer(attempt.timer),
                            );
                          }}
                          onResume={() => {
                            updateAttemptTimer(
                              attemptIndex,
                              resumeTimer(attempt.timer),
                            );
                          }}
                          onPause={() => {
                            updateAttemptTimer(
                              attemptIndex,
                              pauseTimer(attempt.timer),
                            );
                          }}
                          onStop={() => {
                            updateAttemptTimer(
                              attemptIndex,
                              stopTimer(attempt.timer),
                            );
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
                  {!isFinalized && climb.climbAttempts.length > 1 ? (
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        handleRemoveAttempt(attemptIndex);
                      }}
                    >
                      Remove attempt
                    </Button>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
          {!isFinalized ? (
            <Button
              size="compact-sm"
              variant="light"
              onClick={handleAddAttempt}
            >
              Add attempt
            </Button>
          ) : null}
        </Stack>

        {!isFinalized ? (
          <Button
            size="compact-sm"
            variant="subtle"
            color="red"
            onClick={onRemove}
          >
            Remove climb
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
};
