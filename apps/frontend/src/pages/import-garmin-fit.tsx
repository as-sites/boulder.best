import { useMemo, useRef, useState } from 'react';
import {
  Button,
  Container,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { finalizeStoppedSession } from '../offline/index.js';
import { importSessionFormFromGarminFit } from '../tracker/import-garmin-fit.js';
import { createEmptySessionForm } from '../tracker/session-form-state.js';
import { useCachedGymsQuery } from '../tracker/use-cached-gyms-query.js';

interface ImportFailure {
  fileName: string;
  message: string;
}

export const ImportGarminFitPage = () => {
  const gymsQuery = useCachedGymsQuery();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFailures, setImportFailures] = useState<ImportFailure[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const selectedGym = useMemo(
    () => gymsQuery.data?.find((gym) => gym.id === gymId),
    [gymId, gymsQuery.data],
  );
  const locationOptions =
    selectedGym?.locations.map((label) => ({
      value: label,
      label,
    })) ?? [];
  const requiresLocation = (selectedGym?.locations.length ?? 0) > 0;
  const canImport =
    gymId !== null &&
    (!requiresLocation || location !== null) &&
    files.length > 0;
  const locationPlaceholder =
    gymId === null
      ? 'Select a gym first'
      : requiresLocation
        ? 'Select a location'
        : 'No locations for this gym';

  const handleImport = async () => {
    if (!canImport) {
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportFailures([]);
    setImportedCount(0);

    let nextImportedCount = 0;
    const failures: ImportFailure[] = [];

    for (const file of files) {
      try {
        const imported = await importSessionFormFromGarminFit(file, {
          ...createEmptySessionForm(),
          gymId,
          location,
          notes,
        });
        await finalizeStoppedSession(imported, undefined, {
          clearActiveDraft: false,
        });
        nextImportedCount += 1;
      } catch (error) {
        failures.push({
          fileName: file.name,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to import Garmin .fit file',
        });
      }
    }

    setImportedCount(nextImportedCount);
    setImportFailures(failures);

    if (nextImportedCount === 0) {
      setImportError(
        failures[0]?.message ?? 'Unable to import Garmin .fit files',
      );
    }

    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsImporting(false);
  };

  return (
    <Container size="sm">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Import Garmin .fit files</Title>
          <Text c="dimmed" size="sm">
            Import one or more Garmin activities as stopped sessions using the
            same gym, location, and notes.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Select
            label="Gym"
            placeholder={
              gymsQuery.isLoading ? 'Loading gyms...' : 'Select a gym'
            }
            data={
              gymsQuery.data?.map((gym) => ({
                value: gym.id,
                label: gym.name,
              })) ?? []
            }
            value={gymId}
            onChange={(value) => {
              setGymId(value);
              setLocation(null);
            }}
            searchable
            nothingFoundMessage="No gyms found"
          />

          <Select
            label="Location"
            placeholder={locationPlaceholder}
            data={locationOptions}
            value={location}
            onChange={setLocation}
            disabled={gymId === null || !requiresLocation}
            searchable={requiresLocation}
            nothingFoundMessage="No locations found"
          />

          <Textarea
            label="Session notes"
            placeholder="Optional notes applied to every imported session"
            value={notes}
            onChange={(event) => {
              setNotes(event.currentTarget.value);
            }}
            minRows={2}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".fit,application/octet-stream,application/vnd.ant.fit"
            aria-label="Choose Garmin FIT files"
            onChange={(event) => {
              setFiles(Array.from(event.currentTarget.files ?? []));
            }}
          />

          {files.length > 0 ? (
            <Text size="sm">{files.length} file(s) selected</Text>
          ) : null}

          <Group gap="xs">
            <Button
              disabled={!canImport || isImporting}
              onClick={() => void handleImport()}
            >
              {isImporting ? 'Importing...' : 'Import selected .fit files'}
            </Button>
          </Group>

          {importedCount > 0 ? (
            <Text c="green" component="output" size="sm">
              Imported {importedCount} session(s).
            </Text>
          ) : null}

          {importError ? (
            <Text c="red" size="sm" role="alert">
              {importError}
            </Text>
          ) : null}

          {importFailures.length > 0 ? (
            <Stack gap={4}>
              {importFailures.map((failure) => (
                <Text
                  c="red"
                  key={`${failure.fileName}-${failure.message}`}
                  size="sm"
                >
                  {failure.fileName}: {failure.message}
                </Text>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </Container>
  );
};
