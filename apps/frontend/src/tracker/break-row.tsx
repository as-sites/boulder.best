import { useState } from 'react';
import { ActionIcon, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { CheckIcon, ClockIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { useWatch, type Control } from 'react-hook-form';
import { TimerDurationInput } from '../components/timer/timer-duration-input.js';
import {
  useAutoRestTiming,
  useTimerDisplayMilliseconds,
} from '../lib/settings/index.js';
import {
  elapsedDurationMs,
  formatDurationMs,
  parseDurationInput,
} from '../lib/timer/index.js';
import type { SessionFormValues, TimerState } from '../offline/db/types.js';

export interface BreakRowProps {
  control: Control<SessionFormValues>;
  index: number;
  isFinalized: boolean;
  onEndBreak: () => void;
  onTimerChange: (timer: TimerState) => void;
  onDurationMsChange: (durationMs: number) => void;
  onRemove: () => void;
}

export const BreakRow = ({
  control,
  index,
  isFinalized,
  onEndBreak,
  onTimerChange,
  onDurationMsChange,
  onRemove,
}: BreakRowProps) => {
  const [isEditingManualDuration, setIsEditingManualDuration] = useState(false);
  const [manualDurationDraft, setManualDurationDraft] = useState('');
  const [manualDurationError, setManualDurationError] = useState<string | null>(
    null,
  );

  const entry = useWatch({ control, name: `entries.${index}` });
  const { enabled: showTimerMilliseconds } = useTimerDisplayMilliseconds();
  const { enabled: autoRestEnabled, durationMinutes: autoRestDurationMinutes } =
    useAutoRestTiming();

  if (entry.type !== 'break') {
    return null;
  }

  const isBreakActive =
    entry.timer.status === 'running' || entry.timer.status === 'paused';
  const canEditManualDuration =
    entry.timer.status === 'idle' || entry.timer.status === 'stopped';
  const initialDurationValue = formatDurationMs(
    elapsedDurationMs(entry.timer),
    {
      showMilliseconds: showTimerMilliseconds,
    },
  );

  const closeManualDurationEditor = () => {
    setIsEditingManualDuration(false);
    setManualDurationError(null);
  };

  const openManualDurationEditor = () => {
    setIsEditingManualDuration(true);
    setManualDurationDraft(initialDurationValue);
    setManualDurationError(null);
  };

  const commitManualDuration = () => {
    const trimmed = manualDurationDraft.trim();
    if (!trimmed || trimmed === initialDurationValue) {
      closeManualDurationEditor();
      return;
    }

    const durationMs = parseDurationInput(trimmed);
    if (durationMs === null) {
      setManualDurationError(
        'Enter time as M:SS or M:SS.mmm (e.g. 1:30 or 1:30.250)',
      );
      return;
    }

    onDurationMsChange(durationMs);
    onTimerChange({
      status: 'stopped',
      accumulatedDurationMs: durationMs,
      activeStartTime: null,
    });
    closeManualDurationEditor();
  };

  const targetDurationMs = autoRestEnabled
    ? autoRestDurationMinutes * 60_000
    : null;
  const targetLabel =
    targetDurationMs !== null
      ? formatDurationMs(targetDurationMs, { showMilliseconds: false })
      : null;

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Break</Text>
          <Group gap="xs">
            <TimerDurationInput
              timer={entry.timer}
              size="sm"
              variant="filled"
              showMilliseconds={showTimerMilliseconds}
              aria-label={`Break duration (M:SS${showTimerMilliseconds ? '.mmm' : ''})`}
              readOnly={!(isEditingManualDuration && canEditManualDuration)}
              value={
                isEditingManualDuration && canEditManualDuration
                  ? manualDurationDraft
                  : undefined
              }
              error={
                isEditingManualDuration
                  ? (manualDurationError ?? undefined)
                  : undefined
              }
              leftSection={<ClockIcon aria-hidden size={16} />}
              rightSectionPointerEvents="all"
              rightSection={
                !isFinalized && canEditManualDuration ? (
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={isEditingManualDuration ? 'green' : 'gray'}
                    aria-label={
                      isEditingManualDuration
                        ? 'Confirm break duration'
                        : 'Edit break duration'
                    }
                    onMouseDown={(event) => {
                      if (isEditingManualDuration) {
                        event.preventDefault();
                      }
                    }}
                    onClick={() => {
                      if (isEditingManualDuration) {
                        commitManualDuration();
                        return;
                      }
                      openManualDurationEditor();
                    }}
                  >
                    {isEditingManualDuration ? (
                      <CheckIcon aria-hidden size={14} />
                    ) : (
                      <PencilSimpleIcon aria-hidden size={14} />
                    )}
                  </ActionIcon>
                ) : null
              }
              onChange={(event) => {
                if (!(isEditingManualDuration && canEditManualDuration)) {
                  return;
                }
                setManualDurationDraft(event.currentTarget.value);
                setManualDurationError(null);
              }}
              onBlur={() => {
                if (isEditingManualDuration && canEditManualDuration) {
                  commitManualDuration();
                }
              }}
              onKeyDown={(event) => {
                if (!(isEditingManualDuration && canEditManualDuration)) {
                  return;
                }
                if (event.key === 'Enter') {
                  commitManualDuration();
                }
                if (event.key === 'Escape') {
                  closeManualDurationEditor();
                }
              }}
              onFocus={(event) => {
                if (!(isEditingManualDuration && canEditManualDuration)) {
                  event.currentTarget.blur();
                  return;
                }
                event.currentTarget.select();
              }}
            />
            {targetLabel !== null ? (
              <Text c="dimmed" ff="monospace">
                / {targetLabel}
              </Text>
            ) : null}
          </Group>
        </Group>

        {!isFinalized && isBreakActive ? (
          <Button size="compact-sm" onClick={onEndBreak}>
            End break
          </Button>
        ) : null}

        {!isFinalized ? (
          <Button
            size="compact-sm"
            variant="subtle"
            color="red"
            onClick={onRemove}
          >
            Remove break
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
};
