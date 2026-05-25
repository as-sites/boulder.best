import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Select } from '@trendcapital/react-hook-form-mantine/Select';
import { Textarea } from '@trendcapital/react-hook-form-mantine/Textarea';
import { TextInput } from '@trendcapital/react-hook-form-mantine/TextInput';
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
} from 'react-hook-form';
import { useTimerDisplayMilliseconds } from '../lib/settings/index.js';
import type { SessionFormValues } from '../offline/db/types.js';
import { ClimbAttemptRow } from './climb-attempt-row.js';
import { ClimbPhotoAttachments } from './climb-photo-attachments.js';
import { confirmRemoval } from './confirm-removal.js';
import { createClimbAttempt } from './entry-factory.js';

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
          {attemptsField.fields.map((field, attemptIndex) => {
            const attempt = climb.climbAttempts[attemptIndex];
            if (!attempt) {
              return null;
            }

            return (
              <ClimbAttemptRow
                key={field.id}
                entryPath={entryPath}
                attemptIndex={attemptIndex}
                attempt={attempt}
                isFinalized={isFinalized}
                showTimerMilliseconds={showTimerMilliseconds}
                canRemove={!isFinalized && climb.climbAttempts.length > 1}
                onRemove={() => {
                  handleRemoveAttempt(attemptIndex);
                }}
                onTimerChange={updateAttemptTimer}
                onDurationMsChange={(attemptIdx, durationMs) => {
                  setValue(
                    `${entryPath}.climbAttempts.${attemptIdx}.durationMs`,
                    durationMs,
                    { shouldDirty: true },
                  );
                }}
              />
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
