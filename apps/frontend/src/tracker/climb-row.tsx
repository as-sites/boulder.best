import {
  Button,
  Checkbox,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
} from 'react-hook-form';
import { TimerDisplay } from '../components/timer/timer-display.js';
import {
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
  const entryPath = `entries.${index}` as const;
  const climb = useWatch({ control, name: entryPath });

  const attemptsField = useFieldArray({
    control,
    name: `entries.${index}.climbAttempts`,
  });

  if (climb.type !== 'climb') {
    return null;
  }

  const updateClimbTimer = (timer: typeof climb.timer) => {
    setValue(`${entryPath}.timer`, timer, { shouldDirty: true });
  };

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
      Boolean(attempt.notes?.trim());

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
          <Text fw={600}>{climb.name ?? defaultName}</Text>
          <Group gap="sm">
            <TimerDisplay timer={climb.timer} />
            {!isFinalized ? (
              <TimerControls
                timer={climb.timer}
                onStart={() => {
                  updateClimbTimer(startTimer(climb.timer));
                }}
                onResume={() => {
                  updateClimbTimer(resumeTimer(climb.timer));
                }}
                onPause={() => {
                  updateClimbTimer(pauseTimer(climb.timer));
                }}
                onStop={() => {
                  updateClimbTimer(stopTimer(climb.timer));
                }}
              />
            ) : null}
          </Group>
        </Group>

        <TextInput
          label="Name"
          disabled={isFinalized}
          value={climb.name ?? ''}
          placeholder={defaultName}
          onChange={(event) => {
            setValue(`${entryPath}.name`, event.currentTarget.value || null, {
              shouldDirty: true,
            });
          }}
        />

        <Select
          label="Grade"
          disabled={isFinalized}
          comboboxProps={{ withinPortal: false }}
          data={grades}
          value={climb.grade}
          onChange={(grade) => {
            setValue(`${entryPath}.grade`, grade, { shouldDirty: true });
          }}
          clearable
          searchable
        />

        <Checkbox
          label="Completed"
          disabled={isFinalized}
          checked={climb.completed ?? false}
          onChange={(event) => {
            setValue(`${entryPath}.completed`, event.currentTarget.checked, {
              shouldDirty: true,
            });
          }}
        />

        <Textarea
          label="Climb notes"
          disabled={isFinalized}
          value={climb.notes ?? ''}
          minRows={2}
          onChange={(event) => {
            setValue(`${entryPath}.notes`, event.currentTarget.value || null, {
              shouldDirty: true,
            });
          }}
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
                    <TimerDisplay timer={attempt.timer} size="sm" />
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
                <Textarea
                  label="Attempt note"
                  disabled={isFinalized}
                  value={attempt.notes ?? ''}
                  minRows={1}
                  onChange={(event) => {
                    setValue(
                      `${entryPath}.climbAttempts.${attemptIndex}.notes`,
                      event.currentTarget.value || null,
                      { shouldDirty: true },
                    );
                  }}
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
