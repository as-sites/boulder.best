import { Container, Loader, Stack, Text } from '@mantine/core';

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
  <Container {...(pb !== undefined ? { pb } : {})} size="sm">
    <Stack align="center" gap="sm">
      {spinner ? <Loader size="sm" /> : null}
      <Text c="dimmed" size="sm">
        {message}
      </Text>
    </Stack>
  </Container>
);
