import {
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';

export type StatusPanelVariant = 'loading' | 'error' | 'not-found';

export interface StatusPanelProps {
  variant: StatusPanelVariant;
  /** Descriptive text. Required for loading; shown as error detail otherwise. */
  message?: string;
  /** Optional heading. Shown above the message in error variant. */
  title?: string;
  /** Show spinner in loading variant. Defaults to true. */
  spinner?: boolean;
  /** Raw error value; its .message is used when no explicit message is given. */
  error?: unknown;
  /** Shows a "Try again" button and expands the error layout when provided. */
  onRetry?: () => void;
  /**
   * Extra bottom padding, e.g. for safe-area insets. Defaults to the top
   * padding.
   */
  pb?: string;
}

export const StatusPanel = ({
  variant,
  message,
  title,
  spinner = true,
  error,
  onRetry,
  pb,
}: StatusPanelProps) => {
  const containerProps = pb !== undefined ? { pb } : {};

  if (variant === 'loading') {
    return (
      <Container {...containerProps} size="sm">
        <Stack align="center" gap="sm">
          {spinner ? <Loader size="sm" /> : null}
          <Text c="dimmed" size="sm">
            {message}
          </Text>
        </Stack>
      </Container>
    );
  }

  if (variant === 'not-found') {
    return (
      <Container {...containerProps} size="sm">
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={1}>Page not found</Title>
            <Text c="dimmed" size="sm">
              That link does not match any page in Boulder Best. Head home or
              pick a section from the menu.
            </Text>
          </Stack>
          <Button component={Link} to="/">
            Back to home
          </Button>
        </Stack>
      </Container>
    );
  }

  // variant === 'error'
  const errorMessage =
    message ??
    (error instanceof Error ? error.message : 'Something went wrong');

  if (onRetry) {
    const errorTitle = title ?? 'Something went wrong';
    return (
      <Container {...containerProps} size="sm">
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={1}>{errorTitle}</Title>
            <Text c="dimmed" size="sm">
              This page hit an unexpected error. You can try again or return
              home.
            </Text>
            <Text c="red" size="sm">
              {errorMessage}
            </Text>
          </Stack>
          <Group gap="sm">
            <Button onClick={onRetry}>Try again</Button>
            <Button component={Link} to="/" variant="light">
              Back to home
            </Button>
          </Group>
        </Stack>
      </Container>
    );
  }

  return (
    <Container {...containerProps} size="sm">
      <Stack gap="sm">
        {title ? <Title order={1}>{title}</Title> : null}
        <Text c="red" size="sm">
          {errorMessage}
        </Text>
      </Stack>
    </Container>
  );
};
