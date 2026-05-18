import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { TimerDisplay } from '../components/timer/timer-display.js';
import type {
  SessionFormEntry,
  SessionFormValues,
} from '../offline/db/types.js';
import { autosaveActiveDraft } from '../offline/draft/draft-autosave.js';
import { BreakRow } from './break-row.js';
import { ClimbRow } from './climb-row.js';
import { confirmRemoval } from './confirm-removal.js';
import {
  countClimbsInEntries,
  createBreakEntry,
  createClimbEntry,
  defaultClimbName,
  resequenceEntries,
} from './entry-factory.js';
import { sessionFormSchema } from './session-form-schema.js';
import {
  createEmptySessionForm,
  sessionDisplayTimer,
  startSession,
  stopSession,
} from './session-form-state.js';
import { applyBreakEnd, applyBreakStart } from './timer-orchestration.js';
import { useCachedGymsQuery } from './use-cached-gyms-query.js';

export interface SessionFormProps {
  initialValues?: SessionFormValues;
  onStopped?: (values: SessionFormValues) => void;
}

export const SessionForm = ({
  initialValues = createEmptySessionForm(),
  onStopped,
}: SessionFormProps) => {
  const gymsQuery = useCachedGymsQuery();
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: initialValues,
  });

  const values = useWatch({
    control: form.control,
    defaultValue: initialValues,
  });
  const status = values.status ?? initialValues.status;
  const gymId = values.gymId ?? initialValues.gymId;
  const startTime = values.startTime ?? initialValues.startTime;
  const totalDurationMs =
    values.totalDurationMs ?? initialValues.totalDurationMs;
  const notes = values.notes ?? initialValues.notes;
  const entries = (values.entries ??
    initialValues.entries) as SessionFormEntry[];
  const canStart = status === 'not_started' && gymId !== null;
  const canStop = status === 'active';
  const isFinalized = status === 'stopped';
  const canEditEntries = status === 'active';

  const entriesField = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const selectedGym = useMemo(
    () => gymsQuery.data?.find((gym) => gym.id === gymId),
    [gymId, gymsQuery.data],
  );
  const grades = selectedGym?.grades ?? [];

  useEffect(() => {
    if (status === 'not_started') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void autosaveActiveDraft(form.getValues());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, status, values]);

  const gymOptions =
    gymsQuery.data?.map((gym) => ({
      value: gym.id,
      label: gym.name,
    })) ?? [];

  const handleStart = () => {
    try {
      const next = startSession(form.getValues());
      form.reset(next);
    } catch (error) {
      form.setError('gymId', {
        message:
          error instanceof Error ? error.message : 'Unable to start session',
      });
    }
  };

  const handleStop = () => {
    try {
      const next = stopSession(form.getValues());
      form.reset(next);
      onStopped?.(next);
    } catch (error) {
      form.setError('root', {
        message:
          error instanceof Error ? error.message : 'Unable to stop session',
      });
    }
  };

  const handleAddClimb = () => {
    const currentEntries = form.getValues('entries');
    const climbNumber = countClimbsInEntries(currentEntries);
    const name = defaultClimbName(currentEntries, climbNumber);
    entriesField.append(createClimbEntry(currentEntries.length, name));
  };

  const handleAddBreak = () => {
    const currentEntries = form.getValues('entries');
    const breakIndex = currentEntries.length;
    const withBreak = [
      ...currentEntries,
      createBreakEntry(breakIndex),
    ] as SessionFormValues['entries'];
    form.setValue('entries', applyBreakStart(withBreak, breakIndex), {
      shouldDirty: true,
    });
  };

  const handleEndBreak = (breakIndex: number) => {
    const currentEntries = form.getValues('entries');
    form.setValue('entries', applyBreakEnd(currentEntries, breakIndex), {
      shouldDirty: true,
    });
  };

  const handleRemoveEntry = (index: number) => {
    const entry = form.getValues(`entries.${index}`);
    const needsConfirm =
      entry.type === 'climb'
        ? entry.timer.status === 'running' ||
          entry.timer.status === 'paused' ||
          Boolean(entry.notes?.trim())
        : entry.timer.status === 'running' || entry.timer.status === 'paused';

    if (needsConfirm && !confirmRemoval('Remove this entry?')) {
      return;
    }

    entriesField.remove(index);
    form.setValue('entries', resequenceEntries(form.getValues('entries')), {
      shouldDirty: true,
    });
  };

  const displayTimer = sessionDisplayTimer({
    startTime: startTime ?? null,
    status,
    totalDurationMs,
  });

  let climbOrdinal = 0;

  return (
    <FormProvider {...form}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Session</Title>
          <TimerDisplay timer={displayTimer} size="lg" fw={600} />
        </Group>

        <Select
          label="Gym"
          comboboxProps={{ withinPortal: false }}
          placeholder={gymsQuery.isLoading ? 'Loading gyms...' : 'Select a gym'}
          data={gymOptions}
          disabled={status !== 'not_started'}
          value={gymId ?? null}
          onChange={(selectedGymId) => {
            form.setValue(
              'gymId',
              typeof selectedGymId === 'string' ? selectedGymId : null,
              { shouldDirty: true },
            );
          }}
          error={form.formState.errors.gymId?.message}
          searchable
          nothingFoundMessage="No gyms found"
        />

        <Textarea
          label="Session notes"
          placeholder="Optional notes for this session"
          disabled={isFinalized}
          value={notes ?? ''}
          onChange={(event) => {
            form.setValue('notes', event.currentTarget.value || null, {
              shouldDirty: true,
            });
          }}
          minRows={2}
        />

        {canEditEntries ? (
          <Group>
            <Button size="compact-sm" variant="light" onClick={handleAddClimb}>
              Add climb
            </Button>
            <Button size="compact-sm" variant="light" onClick={handleAddBreak}>
              Add break
            </Button>
          </Group>
        ) : null}

        <Stack gap="md">
          {entries.map((entry, index) => {
            if (entry.type === 'break') {
              return (
                <BreakRow
                  key={entry.id}
                  control={form.control}
                  index={index}
                  isFinalized={isFinalized}
                  onEndBreak={() => {
                    handleEndBreak(index);
                  }}
                  onRemove={() => {
                    handleRemoveEntry(index);
                  }}
                />
              );
            }

            const defaultName = defaultClimbName(entries, climbOrdinal);
            climbOrdinal += 1;

            return (
              <ClimbRow
                key={entry.id}
                control={form.control}
                index={index}
                grades={grades}
                isFinalized={isFinalized}
                defaultName={defaultName}
                onRemove={() => {
                  handleRemoveEntry(index);
                }}
              />
            );
          })}
        </Stack>

        {form.formState.errors.root?.message ? (
          <Text c="red" size="sm">
            {form.formState.errors.root.message}
          </Text>
        ) : null}

        <Group>
          <Button disabled={!canStart} onClick={handleStart}>
            Start session
          </Button>
          <Button color="red" disabled={!canStop} onClick={handleStop}>
            Stop session
          </Button>
        </Group>
      </Stack>
    </FormProvider>
  );
};
