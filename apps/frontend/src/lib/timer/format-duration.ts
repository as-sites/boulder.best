interface FormatDurationMsOptions {
  showMilliseconds?: boolean;
}

/** Formats milliseconds as `M:SS` or `H:MM:SS` when an hour or more. */
export const formatDurationMs = (
  durationMs: number,
  options: FormatDurationMsOptions = {},
): string => {
  const clampedMs = Math.max(0, Math.floor(durationMs));
  const totalSeconds = Math.floor(clampedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = clampedMs % 1000;

  const paddedSeconds = String(seconds).padStart(2, '0');
  const suffix = options.showMilliseconds
    ? `.${String(milliseconds).padStart(3, '0')}`
    : '';

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}${suffix}`;
  }

  return `${minutes}:${paddedSeconds}${suffix}`;
};

const isDigits = (s: string): boolean => /^\d+$/.test(s);
const isSecondWithOptionalMs = (s: string): boolean =>
  /^\d{1,2}(?:\.\d{1,3})?$/.test(s);

const parseSecondWithOptionalMs = (s: string): number | null => {
  const [secondPart, millisecondPart] = s.split('.') as [string, string?];
  if (!isDigits(secondPart)) {
    return null;
  }
  const secondValue = Number.parseInt(secondPart, 10);
  if (secondValue > 59) {
    return null;
  }
  const msValue =
    millisecondPart === undefined
      ? 0
      : Number.parseInt(millisecondPart.padEnd(3, '0'), 10);
  return secondValue * 1000 + msValue;
};

/**
 * Parses user duration input into milliseconds. Accepts `S`, `M:SS(.mmm)`,
 * `MM:SS(.mmm)`, or `H:MM:SS(.mmm)` formats. Returns `null` for empty or
 * invalid input.
 */
export const parseDurationInput = (input: string): number | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(':');

  if (parts.length === 1) {
    const [part] = parts as [string];
    if (!isDigits(part)) {
      return null;
    }
    return Number.parseInt(part, 10) * 1000;
  }

  if (parts.length === 2) {
    const [mPart, sPart] = parts as [string, string];
    if (!isDigits(mPart) || !isSecondWithOptionalMs(sPart)) {
      return null;
    }
    const secondMs = parseSecondWithOptionalMs(sPart);
    if (secondMs === null) {
      return null;
    }
    return Number.parseInt(mPart, 10) * 60_000 + secondMs;
  }

  if (parts.length === 3) {
    const [hPart, mPart, sPart] = parts as [string, string, string];
    if (
      !isDigits(hPart) ||
      !isDigits(mPart) ||
      !isSecondWithOptionalMs(sPart)
    ) {
      return null;
    }
    const m = Number.parseInt(mPart, 10);
    const secondMs = parseSecondWithOptionalMs(sPart);
    if (m > 59 || secondMs === null) {
      return null;
    }
    return Number.parseInt(hPart, 10) * 3_600_000 + m * 60_000 + secondMs;
  }

  return null;
};
