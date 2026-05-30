/**
 * Bottom padding applied to the tracker page container and the PageLoading
 * fallback, keeping content above the device home indicator.
 */
export const TRACKER_PAGE_PB =
  'calc(var(--mantine-spacing-xl) + env(safe-area-inset-bottom))';

/**
 * Accounts for the height of the fixed Stop-session footer (3.5 rem button +
 * spacing) plus the device safe-area inset. Used as bottom padding on the form
 * stack and as scroll-margin-bottom on each entry.
 */
export const TRACKER_FOOTER_PB =
  'calc(3.5rem + var(--mantine-spacing-md) + env(safe-area-inset-bottom, 0px))';
