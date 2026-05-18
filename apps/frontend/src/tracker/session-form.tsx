import { useEffect } from 'react';
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
import { useForm, useWatch } from 'react-hook-form';
import { TimerDisplay } from '../components/timer/timer-display.js';
import type { SessionFormValues } from '../offline/db/types.js';
import { autosaveActiveDraft } from '../offline/draft/draft-autosave.js';
import { sessionFormSchema } from './session-form-schema.js';
import {
  createEmptySessionForm,
  sessionDisplayTimer,
  startSession,
  stopSession,
} from './session-form-state.js';
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

  const watched = useWatch({
    control: form.control,
    defaultValue: initialValues,
  });
  const status = watched.status ?? initialValues.status;
  const gymId = watched.gymId ?? initialValues.gymId;
  const startTime = watched.startTime ?? initialValues.startTime;
  const totalDurationMs =
    watched.totalDurationMs ?? initialValues.totalDurationMs;
  const notes = watched.notes ?? initialValues.notes;
  const canStart = status === 'not_started' && gymId !== null;
  const canStop = status === 'active';

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
  }, [form, status, watched]);

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

  const displayTimer = sessionDisplayTimer({
    startTime: startTime ?? null,
    status,
    totalDurationMs,
  });

  return (
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
          const nextGymId =
            typeof selectedGymId === 'string' ? selectedGymId : null;
          form.setValue('gymId', nextGymId, { shouldDirty: true });
        }}
        error={form.formState.errors.gymId?.message}
        searchable
        nothingFoundMessage="No gyms found"
      />

      <Textarea
        label="Session notes"
        placeholder="Optional notes for this session"
        disabled={status === 'stopped'}
        value={notes ?? ''}
        onChange={(event) => {
          form.setValue('notes', event.currentTarget.value || null, {
            shouldDirty: true,
          });
        }}
        minRows={2}
      />

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
  );
};
