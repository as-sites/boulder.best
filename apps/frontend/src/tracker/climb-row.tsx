import { useState } from 'react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
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
  onCommit: (durationMs: number) => void;
}

/** Controlled-free input that parses MM:SS (or S / H:MM:SS) on blur or Enter. */
const ManualDurationInput = ({ onCommit }: ManualDurationInputProps) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const ms = parseDurationInput(trimmed);
    if (ms === null) {
      setError('Enter time as M:SS (e.g. 1:30)');
      return;
    }
    setError(null);
    onCommit(ms);
  };

  return (
    <TextInput
      label="Duration (MM:SS)"
      placeholder="0:00"
      size="xs"
      value={value}
      error={error}
      onChange={(event) => {
        setValue(event.currentTarget.value);
        setError(null);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit();
        }
      }}
    />
  );
};

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
    const reordered = getValues(`${entryPath}.climbAttempts`).map(
      (item, sequenceOrder) => ({ ...item, sequenceOrder }),
    );
    setValue(`${entryPath}.climbAttempts`, reordered, { shouldDirty: true });
  };

  const handleAddAttempt = () => {
    const nextOrder = climb.climbAttempts.length;
    attemptsField.append(createClimbAttempt(nextOrder));
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
          {climb.climbAttempts.map((attempt, attemptIndex) => (
            <Paper key={attemptIndex} p="sm" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Attempt {attemptIndex + 1}</Text>
                  <Group gap="sm">
                    <TimerDisplay
                      timer={attempt.timer}
                      size="sm"
                      showMilliseconds={showTimerMilliseconds}
                    />
                    {!isFinalized ? (
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
                {!isFinalized && attempt.timer.status === 'idle' ? (
                  <ManualDurationInput
                    onCommit={(durationMs) => {
                      setValue(
                        `${entryPath}.climbAttempts.${attemptIndex}.durationMs`,
                        durationMs,
                        { shouldDirty: true },
                      );
                      updateAttemptTimer(attemptIndex, {
                        status: 'stopped',
                        accumulatedDurationMs: durationMs,
                        activeStartTime: null,
                      });
                    }}
                  />
                ) : null}
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
          ))}
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
