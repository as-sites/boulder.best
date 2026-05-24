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

/**
 * Parses user duration input into milliseconds. Accepts `S`, `M:SS`, `MM:SS`,
 * or `H:MM:SS` formats. Returns `null` for empty or invalid input.
 */
export const parseDurationInput = (input: string): number | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(':');

  if (parts.length === 1) {
    if (!isDigits(parts[0])) {
      return null;
    }
    return Number.parseInt(parts[0], 10) * 1000;
  }

  if (parts.length === 2) {
    const [mPart, sPart] = parts as [string, string];
    if (!isDigits(mPart) || !isDigits(sPart)) {
      return null;
    }
    const s = Number.parseInt(sPart, 10);
    if (s > 59) {
      return null;
    }
    return (Number.parseInt(mPart, 10) * 60 + s) * 1000;
  }

  if (parts.length === 3) {
    const [hPart, mPart, sPart] = parts as [string, string, string];
    if (!isDigits(hPart) || !isDigits(mPart) || !isDigits(sPart)) {
      return null;
    }
    const m = Number.parseInt(mPart, 10);
    const s = Number.parseInt(sPart, 10);
    if (m > 59 || s > 59) {
      return null;
    }
    return (Number.parseInt(hPart, 10) * 3600 + m * 60 + s) * 1000;
  }

  return null;
};
