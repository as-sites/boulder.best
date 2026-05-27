import type { Ref } from 'react';
import { TextInput, type TextInputProps } from '@mantine/core';
import cx from 'clsx';
import { formatDurationMs, parseDurationInput } from '../lib/timer/index.js';
import classes from './duration-input.module.css';

export interface DurationInputProps extends Omit<TextInputProps, 'type'> {
  ref?: Ref<HTMLInputElement>;
  /**
   * Show the hours segment, expanding the format from M:SS to H:MM:SS; default
   * false
   */
  withSeconds?: boolean;
  /** Show milliseconds after the seconds (e.g. 1:30.250); default false */
  withMilliseconds?: boolean;
  /** Minimum duration in milliseconds; enforced on blur by clamping */
  minDurationMs?: number;
  /** Maximum duration in milliseconds; enforced on blur by clamping */
  maxDurationMs?: number;
}

const buildPlaceholder = (
  withSeconds: boolean,
  withMilliseconds: boolean,
): string => {
  const base = withSeconds ? '0:00:00' : '0:00';
  return withMilliseconds ? `${base}.000` : base;
};

/**
 * A duration input styled identically to Mantine's TimeInput but for duration
 * values (M:SS or H:MM:SS) instead of wall-clock time. No AM/PM suffix.
 *
 * Value and onChange follow the same string-based contract as TextInput. On
 * blur the raw text is normalised to canonical form (e.g. "90" → "1:30") and
 * optionally clamped to [minDurationMs, maxDurationMs].
 */
export const DurationInput = ({
  ref,
  withSeconds = false,
  withMilliseconds = false,
  minDurationMs,
  maxDurationMs,
  onChange,
  onBlur,
  placeholder,
  classNames,
  ...rest
}: DurationInputProps) => {
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);

    const raw = event.currentTarget.value;
    if (!raw) {
      return;
    }

    const ms = parseDurationInput(raw);
    if (ms === null) {
      return;
    }

    let clampedMs = ms;
    if (minDurationMs !== undefined) {
      clampedMs = Math.max(clampedMs, minDurationMs);
    }
    if (maxDurationMs !== undefined) {
      clampedMs = Math.min(clampedMs, maxDurationMs);
    }

    const formatted = formatDurationMs(clampedMs, {
      showMilliseconds: withMilliseconds,
    });
    if (formatted !== raw) {
      event.currentTarget.value = formatted;
      onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const resolvedClassNames: TextInputProps['classNames'] =
    typeof classNames === 'function'
      ? (theme, props, ctx) => {
          const resolved = classNames(theme, props, ctx);
          return {
            ...resolved,
            input: cx(classes.input, resolved.input),
          };
        }
      : {
          ...classNames,
          input: cx(classes.input, classNames?.input),
        };

  return (
    <TextInput
      ref={ref}
      type="text"
      inputMode="numeric"
      placeholder={
        placeholder ?? buildPlaceholder(withSeconds, withMilliseconds)
      }
      onChange={onChange}
      onBlur={handleBlur}
      classNames={resolvedClassNames}
      {...rest}
    />
  );
};

DurationInput.displayName = '@boulder/DurationInput';

export namespace DurationInput {
  export type Props = DurationInputProps;
}
