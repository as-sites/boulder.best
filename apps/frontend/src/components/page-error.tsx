import { StatusPanel } from './status-panel.js';

export interface PageErrorProps {
  message: string;
  /** Optional page title shown above the error text. */
  title?: string;
  /**
   * Extra bottom padding, e.g. for safe-area insets. Defaults to the top
   * padding.
   */
  pb?: string;
}

export const PageError = ({ message, title, pb }: PageErrorProps) => (
  <StatusPanel
    variant="error"
    message={message}
    {...(title !== undefined ? { title } : {})}
    {...(pb !== undefined ? { pb } : {})}
  />
);
