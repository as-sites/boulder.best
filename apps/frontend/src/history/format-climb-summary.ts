/**
 * Formats grade and attempt count for climb summary lines (e.g. "V3 · 2
 * attempts").
 */
export const formatClimbSummary = (
  grade: string,
  attemptCount: number,
  completedCount?: number,
): string => {
  const attemptsLabel =
    attemptCount === 1 ? '1 attempt' : `${attemptCount} attempts`;
  const completedLabel =
    completedCount === undefined
      ? null
      : completedCount === 1
        ? '1 completed'
        : `${completedCount} completed`;
  const trimmedGrade = grade.trim();
  const summary = trimmedGrade
    ? `${trimmedGrade} · ${attemptsLabel}`
    : attemptsLabel;
  return completedLabel ? `${summary} · ${completedLabel}` : summary;
};
