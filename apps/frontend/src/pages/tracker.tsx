import { useEffect, useState } from 'react';
import { Container, Stack, Text, Title } from '@mantine/core';
import { PageLoading } from '../components/page-loading.js';
import type { SessionFormValues } from '../offline/db/types.js';
import {
  finalizeStoppedSession,
  restoreActiveDraft,
} from '../offline/index.js';
import { createEmptySessionForm } from '../tracker/session-form-state.js';
import { SessionForm } from '../tracker/session-form.js';

export const TrackerPage = () => {
  const [initialValues, setInitialValues] = useState<SessionFormValues | null>(
    null,
  );
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDraft = async () => {
      const draft = await restoreActiveDraft();
      if (cancelled) {
        return;
      }

      setInitialValues(draft?.formData ?? createEmptySessionForm());
    };

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStopped = (values: SessionFormValues) => {
    setFinalizeError(null);
    void finalizeStoppedSession(values).catch((error: unknown) => {
      setFinalizeError(
        error instanceof Error ? error.message : 'Unable to finalize session',
      );
    });
  };

  if (initialValues === null) {
    return (
      <PageLoading
        message="Loading session..."
        pb="calc(var(--mantine-spacing-xl) + env(safe-area-inset-bottom))"
        spinner={false}
      />
    );
  }

  return (
    <Container
      py="xl"
      pb="calc(var(--mantine-spacing-xl) + env(safe-area-inset-bottom))"
      size="sm"
    >
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={1}>Tracker</Title>
          <Text c="dimmed" size="sm">
            Record climbs and breaks for your session.
          </Text>
        </Stack>

        <SessionForm initialValues={initialValues} onStopped={handleStopped} />

        {finalizeError ? (
          <Text c="red" size="sm" role="alert">
            {finalizeError}
          </Text>
        ) : null}
      </Stack>
    </Container>
  );
};
