import { useLayoutEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { RowsPlusBottomIcon, TrashIcon } from '@phosphor-icons/react';
import { Select } from '@trendcapital/react-hook-form-mantine/Select';
import { Textarea } from '@trendcapital/react-hook-form-mantine/Textarea';
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

const MAX_CLIMB_NAME_LENGTH = 255;

interface ClimbNameHeadingProps {
  defaultName: string;
  disabled: boolean;
  name: string;
  onNameChange: (name: string) => void;
}

const ClimbNameHeading = ({
  defaultName,
  disabled,
  name,
  onNameChange,
}: ClimbNameHeadingProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const storedName = name.trim();
  const displayName = storedName || defaultName;
  const isPlaceholder = !storedName;
  const shownValue = isFocused ? draft : displayName;

  const syncTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = '0';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    syncTextareaHeight();
  }, [shownValue, isFocused]);

  if (disabled) {
    return (
      <Text fw={600} {...(isPlaceholder ? { c: 'dimmed' } : {})}>
        {displayName}
      </Text>
    );
  }

  return (
    <Box
      ref={textareaRef}
      aria-label="Climb name"
      component="textarea"
      maxLength={MAX_CLIMB_NAME_LENGTH}
      rows={1}
      value={shownValue}
      fw={600}
      {...(isPlaceholder && !isFocused ? { c: 'dimmed' } : {})}
      onChange={(event) => {
        if (!isFocused) {
          return;
        }
        const textarea = event.currentTarget;
        setDraft(textarea.value);
        textarea.style.height = '0';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }}
      onBlur={() => {
        setIsFocused(false);
        const raw = draft
          .replaceAll(/\s+/g, ' ')
          .trim()
          .slice(0, MAX_CLIMB_NAME_LENGTH);
        onNameChange(raw);
      }}
      onFocus={() => {
        setIsFocused(true);
        setDraft(isPlaceholder ? '' : storedName);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          textareaRef.current?.blur();
        }
      }}
      style={{
        outline: 'none',
        cursor: 'text',
        minWidth: '4ch',
        border: 'none',
        background: 'transparent',
        marginTop: '2px',
        padding: 0,
        width: '100%',
        font: 'inherit',
        color: 'inherit',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: 'inherit',
        ...(isFocused
          ? {
              boxShadow: '0 0 0 1px var(--mantine-primary-color-filled)',
              borderRadius: 'var(--mantine-radius-sm)',
            }
          : {}),
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

const hasDirtyField = (dirty: unknown): boolean => {
  if (dirty === true) {
    return true;
  }
  if (typeof dirty === 'object' && dirty !== null) {
    return Object.values(dirty).some((f) => hasDirtyField(f));
  }
  return false;
};

export const ClimbRow = ({
  control,
  index,
  sessionId,
  grades,
  isFinalized,
  defaultName,
  onRemove,
}: ClimbRowProps) => {
  const { setValue, getValues, formState } =
    useFormContext<SessionFormValues>();
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

    const dirtyEntry = formState.dirtyFields.entries?.[index] as
      | { climbAttempts?: unknown[] }
      | undefined;
    const dirtyAttemptFields = dirtyEntry?.climbAttempts?.[attemptIndex];
    const needsConfirm =
      attempt.timer.status === 'running' ||
      attempt.timer.status === 'paused' ||
      hasDirtyField(dirtyAttemptFields);

    const removeAttempt = () => {
      attemptsField.remove(attemptIndex);
      const reordered = getValues(`${entryPath}.climbAttempts`).map(
        (item, sequenceOrder) => ({ ...item, sequenceOrder }),
      );
      setValue(`${entryPath}.climbAttempts`, reordered, { shouldDirty: true });
    };

    if (needsConfirm) {
      confirmRemoval('Remove this attempt?', removeAttempt);
      return;
    }

    removeAttempt();
  };

  const handleAddAttempt = () => {
    const nextOrder = climb.climbAttempts.length;
    attemptsField.append(createClimbAttempt(nextOrder));
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <ClimbNameHeading
              defaultName={defaultName}
              disabled={isFinalized}
              name={climb.name}
              onNameChange={(nextName) => {
                setValue(`${entryPath}.name`, nextName, { shouldDirty: true });
              }}
            />
          </Box>
          {!isFinalized ? (
            <Tooltip label="Remove climb" withArrow>
              <ActionIcon
                color="red"
                variant="light"
                size="lg"
                aria-label="Remove climb"
                onClick={() => {
                  confirmRemoval('Remove this climb?', onRemove);
                }}
              >
                <TrashIcon aria-hidden size={20} />
              </ActionIcon>
            </Tooltip>
          ) : null}
        </Group>

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
              size="sm"
              variant="light"
              onClick={handleAddAttempt}
              rightSection={<RowsPlusBottomIcon aria-hidden size={20} />}
            >
              Add attempt
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
};
