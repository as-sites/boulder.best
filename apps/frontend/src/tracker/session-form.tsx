import { useEffect, useMemo, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { CoffeeIcon, MountainsIcon } from '@phosphor-icons/react';
import { Select } from '@trendcapital/react-hook-form-mantine/Select';
import { Textarea } from '@trendcapital/react-hook-form-mantine/Textarea';
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { useAutoRestTiming } from '../lib/settings/index.js';
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
import { TRACKER_FOOTER_PB } from './layout-constants.js';
import { sessionFormSchema } from './session-form-schema.js';
import { startSession, stopSession } from './session-form-state.js';
import {
  applyBreakEnd,
  applyBreakRemove,
  applyBreakStart,
} from './timer-orchestration.js';
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
  const { enabled: autoRestEnabled } = useAutoRestTiming();

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
  const pendingScrollEntryIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    const entryId = pendingScrollEntryIdRef.current;
    if (!entryId) {
      return;
    }

    const element = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (!element) {
      return;
    }

    pendingScrollEntryIdRef.current = null;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [entries]);

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
    const climbEntry = createClimbEntry(
      currentEntries.length,
      defaultClimbName(climbNumber),
    );
    pendingScrollEntryIdRef.current = climbEntry.id;

    const runningBreakIndex = currentEntries.findIndex(
      (entry) => entry.type === 'break' && entry.timer.status === 'running',
    );

    if (runningBreakIndex !== -1) {
      const withBreakEnded = applyBreakEnd(currentEntries, runningBreakIndex);
      form.setValue('entries', [...withBreakEnded, climbEntry], {
        shouldDirty: true,
      });
    } else {
      entriesField.append(climbEntry);
    }
  };

  const handleAddBreak = () => {
    const currentEntries = form.getValues('entries');
    const breakIndex = currentEntries.length;
    const breakEntry = createBreakEntry(breakIndex);
    const withBreak = [
      ...currentEntries,
      breakEntry,
    ] as SessionFormValues['entries'];
    pendingScrollEntryIdRef.current = breakEntry.id;
    form.setValue('entries', applyBreakStart(withBreak, breakIndex), {
      shouldDirty: true,
    });
  };

  const handleAttemptStop = () => {
    if (!autoRestEnabled) {
      return;
    }
    const currentEntries = form.getValues('entries');
    const hasRunningBreak = currentEntries.some(
      (entry) =>
        entry.type === 'break' &&
        (entry.timer.status === 'running' || entry.timer.status === 'paused'),
    );
    if (hasRunningBreak) {
      return;
    }
    const breakIndex = currentEntries.length;
    const breakEntry = createBreakEntry(breakIndex);
    const withBreak = [
      ...currentEntries,
      breakEntry,
    ] as SessionFormValues['entries'];
    pendingScrollEntryIdRef.current = breakEntry.id;
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
    const currentEntries = form.getValues('entries');
    const entry = currentEntries[index];
    if (!entry) {
      return;
    }

    const needsConfirm =
      entry.type === 'climb'
        ? entry.climbAttempts.some(
            (a) => a.timer.status === 'running' || a.timer.status === 'paused',
          ) || Boolean(entry.notes.trim())
        : entry.timer.status === 'running' || entry.timer.status === 'paused';

    const removeEntry = () => {
      const nextEntries =
        entry.type === 'break'
          ? applyBreakRemove(currentEntries, index)
          : currentEntries.filter((_, entryIndex) => entryIndex !== index);

      form.setValue('entries', resequenceEntries(nextEntries), {
        shouldDirty: true,
      });
    };

    if (needsConfirm) {
      confirmRemoval('Remove this entry?', removeEntry);
      return;
    }

    removeEntry();
  };

  const isActive = status === 'active';
  const stopFooterPadding = TRACKER_FOOTER_PB;
  const entryScrollMarginBottom = isActive ? stopFooterPadding : undefined;

  let climbOrdinal = 0;

  const sessionFields = (
    <>
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
              <Box
                data-entry-id={entry.id}
                key={entry.id}
                style={{ scrollMarginBottom: entryScrollMarginBottom }}
              >
                <BreakRow
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
              </Box>
            );
          }

          const defaultName = defaultClimbName(climbOrdinal);
          climbOrdinal += 1;

          return (
            <Box
              data-entry-id={entry.id}
              key={entry.id}
              style={{ scrollMarginBottom: entryScrollMarginBottom }}
            >
              <ClimbRow
                control={form.control}
                index={index}
                sessionId={sessionId}
                grades={grades}
                isFinalized={isFinalized}
                defaultName={defaultName}
                onRemove={() => {
                  handleRemoveEntry(index);
                }}
                onAttemptStop={handleAttemptStop}
              />
            </Box>
          );
        })}
      </Stack>

      {canEditEntries ? (
        <Group grow gap="xs">
          <Button
            leftSection={<MountainsIcon aria-hidden size={20} />}
            size="sm"
            variant="light"
            color="green"
            onClick={handleAddClimb}
          >
            Add climb
          </Button>
          <Button
            leftSection={<CoffeeIcon aria-hidden size={20} />}
            size="sm"
            variant="light"
            color="yellow"
            onClick={handleAddBreak}
          >
            Add break
          </Button>
        </Group>
      ) : null}
    </>
  );

  const rootError = form.formState.errors.root?.message ? (
    <Text c="red" size="sm">
      {form.formState.errors.root.message}
    </Text>
  ) : null;

  return (
    <FormProvider {...form}>
      <Stack gap="md" {...(isActive ? { pb: stopFooterPadding } : {})}>
        {sessionFields}
        {rootError}
        {status === 'not_started' ? (
          <Button fullWidth disabled={!canStart} onClick={handleStart}>
            Start session
          </Button>
        ) : null}
      </Stack>

      {isActive ? (
        <Box
          bg="var(--mantine-color-body)"
          bottom={0}
          left="var(--app-shell-navbar-offset, 0px)"
          pos="fixed"
          pt="xs"
          pb="calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom, 0px))"
          px="md"
          right={0}
          style={{ zIndex: 200 }}
        >
          <Container size="sm">
            <Button
              fullWidth
              color="red"
              disabled={!canStop}
              onClick={handleStop}
            >
              Stop session
            </Button>
          </Container>
        </Box>
      ) : null}
    </FormProvider>
  );
};
