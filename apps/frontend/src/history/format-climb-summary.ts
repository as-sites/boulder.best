/**
 * Formats grade and attempt count for climb summary lines (e.g. "V3 · 2
 * attempts").
 */
export const formatClimbSummary = (
  grade: string,
  attemptCount: number,
): string => {
  const attemptsLabel =
    attemptCount === 1 ? '1 attempt' : `${attemptCount} attempts`;
  const trimmedGrade = grade.trim();
  return trimmedGrade ? `${trimmedGrade} · ${attemptsLabel}` : attemptsLabel;
};
