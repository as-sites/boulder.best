import { describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type {
  ClimbFormEntry,
  SessionFormValues,
} from '../../src/offline/db/types.js';
import { ClimbRow } from '../../src/tracker/climb-row.js';
import {
  createClimbAttempt,
  createClimbEntry,
} from '../../src/tracker/entry-factory.js';
import { createEmptySessionForm } from '../../src/tracker/session-form-state.js';

const ClimbRowWrapper = ({
  isFinalized = false,
  climbEntry = createClimbEntry(0, 'Test Climb'),
}: {
  isFinalized?: boolean;
  climbEntry?: ClimbFormEntry;
}) => {
  const form = useForm<SessionFormValues>({
    defaultValues: {
      ...createEmptySessionForm(),
      entries: [climbEntry],
    },
  });

  return (
    <FormProvider {...form}>
      <ClimbRow
        control={form.control}
        index={0}
        sessionId="test-session-id"
        grades={['V0', 'V1']}
        isFinalized={isFinalized}
        defaultName="Climb 1"
        onRemove={vi.fn()}
      />
    </FormProvider>
  );
};

describe(ClimbRow, () => {
  it('starts expanded in active sessions and shows climb details', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    expect(screen.getByRole('combobox', { name: 'Grade' })).toBeVisible();
    expect(screen.getByLabelText('Climb notes')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Collapse Climb 1' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts collapsed in finalized sessions with a summary line', () => {
    const climbEntry: ClimbFormEntry = {
      ...createClimbEntry(0, 'Test Climb'),
      grade: 'V4',
      climbAttempts: [
        createClimbAttempt(0),
        createClimbAttempt(1),
        createClimbAttempt(2),
      ],
    };

    render(
      <MantineProvider>
        <ClimbRowWrapper isFinalized climbEntry={climbEntry} />
      </MantineProvider>,
    );

    expect(screen.getByText('V4 · 3 attempts')).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Grade' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand Climb 1' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles collapsed rendering when the expand control is clicked', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Climb 1' }));

    expect(
      screen.queryByRole('combobox', { name: 'Grade' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1 attempt')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand Climb 1' }),
    ).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Expand Climb 1' }));

    expect(screen.getByRole('combobox', { name: 'Grade' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Collapse Climb 1' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows timer + edit controls when timer is idle', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    // Duration is always shown as a readonly display field
    expect(
      screen.getByRole('textbox', { name: /duration/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit duration' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  it('switches from timer text to manual input when edit is clicked', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit duration' }));

    expect(
      screen.getByRole('textbox', { name: /duration/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start' }),
    ).not.toBeInTheDocument();
  });

  it('hides manual duration controls after the timer is started', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    // Edit button hidden while timer is running (can't edit a live timer)
    expect(
      screen.queryByRole('button', { name: 'Edit duration' }),
    ).not.toBeInTheDocument();
    // Duration display remains visible (readonly)
    expect(
      screen.getByRole('textbox', { name: /duration/i }),
    ).toBeInTheDocument();
  });

  it('hides manual duration input when finalized', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper isFinalized />
      </MantineProvider>,
    );

    expect(
      screen.queryByRole('button', { name: 'Edit duration' }),
    ).not.toBeInTheDocument();
  });

  it('commits a valid M:SS duration on blur and hides manual input', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit duration' }));
    const input = screen.getByRole('textbox', { name: /duration/i });
    fireEvent.change(input, { target: { value: '1:30' } });
    fireEvent.blur(input);

    // Edit mode closed — duration reverts to readonly display
    expect(screen.getByRole('textbox', { name: /duration/i })).toHaveAttribute(
      'readonly',
    );

    // Timer controls should be gone (stopped timer renders null in TimerControls)
    expect(
      screen.queryByRole('button', { name: 'Start' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit duration' }),
    ).toBeInTheDocument();
  });

  it('shows an error and keeps input visible for invalid duration', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit duration' }));
    const input = screen.getByRole('textbox', { name: /duration/i });
    fireEvent.change(input, { target: { value: 'bad' } });
    fireEvent.blur(input);

    expect(screen.getByText(/enter time as/i)).toBeInTheDocument();
    // Input still visible (timer still idle)
    expect(
      screen.getByRole('textbox', { name: /duration/i }),
    ).toBeInTheDocument();
  });

  it('cancels editing on blur when input is empty', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit duration' }));
    const input = screen.getByRole('textbox', { name: /duration/i });
    fireEvent.blur(input);

    // Timer still idle, edit mode closed — duration reverts to readonly display
    expect(screen.getByRole('textbox', { name: /duration/i })).toHaveAttribute(
      'readonly',
    );
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit duration' }),
    ).toBeInTheDocument();
  });

  it('commits a valid duration on Enter key', () => {
    render(
      <MantineProvider>
        <ClimbRowWrapper />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit duration' }));
    const input = screen.getByRole('textbox', { name: /duration/i });
    fireEvent.change(input, { target: { value: '2:00' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Timer should now be stopped, edit mode closed — duration reverts to readonly display
    expect(screen.getByRole('textbox', { name: /duration/i })).toHaveAttribute(
      'readonly',
    );
  });
});
