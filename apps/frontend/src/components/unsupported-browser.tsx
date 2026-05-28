import {
  Anchor,
  Container,
  MantineProvider,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  MIN_CHROMIUM_VERSION,
  MIN_EDGE_VERSION,
  MIN_FIREFOX_VERSION,
  type UnsupportedBrowserReason,
} from '../lib/browser-support.js';
import { appMantineProviderProps } from '../lib/theme/index.js';

export const UNSUPPORTED_BROWSER_HEADLINE = 'Get a better browser you n00blord';

const supportedBrowsersCopy = `Use the latest Chrome (version ${MIN_CHROMIUM_VERSION}+), Microsoft Edge (version ${MIN_EDGE_VERSION}+), or Firefox (version ${MIN_FIREFOX_VERSION}+). Progressive web app install is only available in supported browsers.`;

const reasonDetail = (
  browserName: string,
  reason: UnsupportedBrowserReason,
): string => {
  if (reason === 'missing-temporal') {
    return `${browserName} does not support the JavaScript Temporal API that Boulder Best needs for accurate session timers.`;
  }

  return `${browserName} is too old for Boulder Best. Update it or switch to a supported browser.`;
};

export interface UnsupportedBrowserProps {
  browserName: string;
  reason: UnsupportedBrowserReason;
}

export const UnsupportedBrowser = ({
  browserName,
  reason,
}: UnsupportedBrowserProps) => (
  <MantineProvider {...appMantineProviderProps}>
    <Container py="xl" size="sm">
      <Stack gap="md">
        <Title order={1}>Boulder Best</Title>
        <Text fw={600} size="lg">
          {UNSUPPORTED_BROWSER_HEADLINE}
        </Text>
        <Text c="dimmed" size="sm">
          {reasonDetail(browserName, reason)}
        </Text>
        <Text c="dimmed" size="sm">
          {supportedBrowsersCopy}
        </Text>
        <Text c="dimmed" size="sm">
          On Android, install{' '}
          <Anchor
            href="https://www.google.com/chrome/"
            rel="noopener noreferrer"
          >
            Chrome
          </Anchor>{' '}
          from the Play Store instead of Samsung Internet.
        </Text>
      </Stack>
    </Container>
  </MantineProvider>
);
