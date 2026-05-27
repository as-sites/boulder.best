import { Container, Stack, Text, Title } from '@mantine/core';

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
  <Container {...(pb !== undefined ? { pb } : {})} size="sm">
    <Stack gap="sm">
      {title ? <Title order={1}>{title}</Title> : null}
      <Text c="red" size="sm">
        {message}
      </Text>
    </Stack>
  </Container>
);
