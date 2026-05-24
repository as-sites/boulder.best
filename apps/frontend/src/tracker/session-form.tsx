import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { Select, Textarea } from '@trendcapital/react-hook-form-mantine';
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import type { SessionFormValues } from '../offline/db/types.js';
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
import { startSession, stopSession } from './session-form-state.js';
import { applyBreakEnd, applyBreakStart } from './timer-orchestration.js';
import { useCachedGymsQuery } from './use-cached-gyms-query.js';

export interface SessionFormProps {
  initialValues: SessionFormValues;
  onStopped?: (values: SessionFormValues) => void;
}

export const SessionForm = ({ initialValues, onStopped }: SessionFormProps) => {
  const gymsQuery = useCachedGymsQuery();
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: initialValues,
  });

  const sessionId = useWatch({ control: form.control, name: 'id' });
  const status = useWatch({ control: form.control, name: 'status' });
  const gymId = useWatch({ control: form.control, name: 'gymId' });
  const location = useWatch({ control: form.control, name: 'location' });
  const entries = useWatch({
    control: form.control,
    name: 'entries',
  });

  const selectedGym = useMemo(
    () => gymsQuery.data?.find((gym) => gym.id === gymId),
    [gymId, gymsQuery.data],
  );
  const grades = selectedGym?.grades ?? [];
  const locationOptions =
    selectedGym?.locations.map((label) => ({
      value: label,
      label,
    })) ?? [];
  const requiresLocation = (selectedGym?.locations.length ?? 0) > 0;
  const canEditLocation =
    status === 'not_started' && gymId !== null && requiresLocation;
  const locationPlaceholder =
    gymId === null
      ? 'Select a gym first'
      : requiresLocation
        ? 'Select a location'
        : 'No locations for this gym';
  const canStart =
    status === 'not_started' &&
    gymId !== null &&
    (!requiresLocation || location !== null);
  const canStop = status === 'active';
  const isFinalized = status === 'stopped';
  const canEditEntries = status === 'active';

  const entriesField = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  useEffect(() => {
    let timeoutId: number;
    const { unsubscribe } = form.watch(() => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void autosaveActiveDraft(form.getValues());
      }, 300);
    });

    return () => {
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, [form]);

  const gymOptions =
    gymsQuery.data?.map((gym) => ({
      value: gym.id,
      label: gym.name,
    })) ?? [];

  const handleStart = () => {
    try {
      const next = startSession(
        form.getValues(),
        Temporal.Now.instant,
        selectedGym ? { gymLocations: selectedGym.locations } : {},
      );
      form.reset(next);
      void autosaveActiveDraft(next);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to start session';
      const field =
        message === 'Select a location before starting the session'
          ? 'location'
          : 'gymId';
      form.setError(field, { message });
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
    entriesField.append(
      createClimbEntry(currentEntries.length, defaultClimbName(climbNumber)),
    );
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
          Boolean(entry.notes.trim())
        : entry.timer.status === 'running' || entry.timer.status === 'paused';

    if (needsConfirm && !confirmRemoval('Remove this entry?')) {
      return;
    }

    entriesField.remove(index);
    form.setValue('entries', resequenceEntries(form.getValues('entries')), {
      shouldDirty: true,
    });
  };

  let climbOrdinal = 0;

  return (
    <FormProvider {...form}>
      <Stack gap="md">
        <Title order={2}>Session</Title>

        <Select<SessionFormValues>
          label="Gym"
          name="gymId"
          comboboxProps={{ withinPortal: false }}
          placeholder={gymsQuery.isLoading ? 'Loading gyms...' : 'Select a gym'}
          data={gymOptions}
          disabled={status !== 'not_started'}
          onChange={() => {
            form.setValue('location', null, { shouldDirty: true });
          }}
          searchable
          nothingFoundMessage="No gyms found"
        />

        <Select<SessionFormValues>
          label="Location"
          name="location"
          comboboxProps={{ withinPortal: false }}
          placeholder={locationPlaceholder}
          data={locationOptions}
          disabled={!canEditLocation}
          searchable={canEditLocation}
          nothingFoundMessage="No locations found"
        />

        <Textarea<SessionFormValues>
          label="Session notes"
          name="notes"
          placeholder="Optional notes for this session"
          disabled={isFinalized}
          minRows={2}
        />

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

            const defaultName = defaultClimbName(climbOrdinal);
            climbOrdinal += 1;

            return (
              <ClimbRow
                key={entry.id}
                control={form.control}
                index={index}
                sessionId={sessionId}
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
