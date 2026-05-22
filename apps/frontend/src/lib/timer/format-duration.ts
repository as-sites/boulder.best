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
