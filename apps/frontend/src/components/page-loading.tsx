import { StatusPanel } from './status-panel.js';

export interface PageLoadingProps {
  message: string;
  /**
   * Extra bottom padding, e.g. for safe-area insets. Defaults to the top
   * padding.
   */
  pb?: string;
  /** Show the spinner. Defaults to true. */
  spinner?: boolean;
}

export const PageLoading = ({
  message,
  pb,
  spinner = true,
}: PageLoadingProps) => (
  <StatusPanel
    variant="loading"
    message={message}
    {...(pb !== undefined ? { pb } : {})}
    spinner={spinner}
  />
);
