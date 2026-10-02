import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gym } from '@boulder/api-contract';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  SessionFormValues,
  SyncQueueItem,
} from '../../src/offline/db/types.js';
import { finalizeStoppedSession } from '../../src/offline/index.js';
import { ImportGarminFitPage } from '../../src/pages/import-garmin-fit.js';
import { importSessionFormFromGarminFit } from '../../src/tracker/import-garmin-fit.js';
import { createEmptySessionForm } from '../../src/tracker/session-form-state.js';

const gymFixture = [
  {
    id: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
    name: 'Test Gym',
    grades: ['V0', 'V1', 'V2'],
    locations: ['Main Wall'],
    updatedAt: '2026-05-13T08:00:00.000Z',
  },
] as const satisfies Gym[];

const gymMocks = vi.hoisted(() => ({
  // oxlint-disable-next-line typescript/require-await, vitest/require-mock-type-parameters
  loadCachedGyms: vi.fn(async () => gymFixture),
}));

vi.mock(import('../../src/offline/gyms/gym-cache.js'), () => ({
  loadCachedGyms: gymMocks.loadCachedGyms,
  // oxlint-disable-next-line vitest/require-mock-type-parameters
  refreshCachedGymsFromApi: vi.fn(),
  // oxlint-disable-next-line vitest/require-mock-type-parameters
  fetchGymsFromApi: vi.fn(),
}));

vi.mock(import('../../src/tracker/import-garmin-fit.js'), () => ({
  // oxlint-disable-next-line vitest/require-mock-type-parameters
  importSessionFormFromGarminFit: vi.fn(),
}));

vi.mock(import('../../src/offline/index.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  // oxlint-disable-next-line vitest/require-mock-type-parameters
  finalizeStoppedSession: vi.fn(),
}));

const renderImportPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <ImportGarminFitPage />
      </MantineProvider>
    </QueryClientProvider>,
  );
};

describe('Garmin FIT import page', () => {
  beforeEach(() => {
    gymMocks.loadCachedGyms.mockResolvedValue(gymFixture);
    vi.mocked(importSessionFormFromGarminFit).mockReset();
    vi.mocked(finalizeStoppedSession).mockReset();
  });

  it('imports multiple Garmin FIT files without clearing the active tracker draft', async () => {
    renderImportPage();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /gym/i })).toHaveAttribute(
        'placeholder',
        'Select a gym',
      );
    });

    fireEvent.click(screen.getByRole('combobox', { name: /gym/i }));
    fireEvent.click(screen.getByText('Test Gym'));
    fireEvent.click(screen.getByRole('combobox', { name: /location/i }));
    fireEvent.click(screen.getByText('Main Wall'));
    fireEvent.change(screen.getByRole('textbox', { name: /session notes/i }), {
      target: { value: 'Imported from Garmin' },
    });

    const firstImported = {
      ...createEmptySessionForm(),
      status: 'stopped' as const,
      gymId: gymFixture[0].id,
      location: 'Main Wall',
      notes: 'Imported from Garmin',
      startTime: '2026-05-20T10:00:00.000Z',
      endTime: '2026-05-20T10:30:00.000Z',
      totalDurationMs: 1_800_000,
    } satisfies SessionFormValues;
    const secondImported = {
      ...createEmptySessionForm(),
      status: 'stopped' as const,
      gymId: gymFixture[0].id,
      location: 'Main Wall',
      notes: 'Imported from Garmin',
      startTime: '2026-05-21T10:00:00.000Z',
      endTime: '2026-05-21T10:45:00.000Z',
      totalDurationMs: 2_700_000,
    } satisfies SessionFormValues;

    vi.mocked(importSessionFormFromGarminFit)
      .mockResolvedValueOnce(firstImported)
      .mockResolvedValueOnce(secondImported);
    vi.mocked(finalizeStoppedSession)
      .mockResolvedValueOnce({ id: firstImported.id } as SyncQueueItem)
      .mockResolvedValueOnce({ id: secondImported.id } as SyncQueueItem);

    const firstFile = new File([new Uint8Array([46])], 'first.fit', {
      type: 'application/octet-stream',
    });
    const secondFile = new File([new Uint8Array([70])], 'second.fit', {
      type: 'application/octet-stream',
    });

    fireEvent.change(screen.getByLabelText('Choose Garmin FIT files'), {
      target: { files: [firstFile, secondFile] },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /import selected \.fit files/i }),
    );

    await waitFor(() => {
      expect(importSessionFormFromGarminFit).toHaveBeenCalledTimes(2);
    });
    expect(importSessionFormFromGarminFit).toHaveBeenNthCalledWith(
      1,
      firstFile,
      expect.objectContaining({
        gymId: gymFixture[0].id,
        location: 'Main Wall',
        notes: 'Imported from Garmin',
      }),
    );
    expect(importSessionFormFromGarminFit).toHaveBeenNthCalledWith(
      2,
      secondFile,
      expect.objectContaining({
        gymId: gymFixture[0].id,
        location: 'Main Wall',
        notes: 'Imported from Garmin',
      }),
    );

    await waitFor(() => {
      expect(finalizeStoppedSession).toHaveBeenCalledTimes(2);
    });
    expect(finalizeStoppedSession).toHaveBeenNthCalledWith(
      1,
      firstImported,
      undefined,
      { clearActiveDraft: false },
    );
    expect(finalizeStoppedSession).toHaveBeenNthCalledWith(
      2,
      secondImported,
      undefined,
      { clearActiveDraft: false },
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Imported 2 session(s).',
    );
  });
});
