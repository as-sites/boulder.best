import { Alert, Anchor, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  BROWSER_SUPPORT_BANNER_DISMISSED_KEY,
  getBrowserSupportStatus,
  MIN_CHROME_VERSION,
} from '../lib/browser-support.js';

export const browserSupportBannerTitle = 'Unsupported browser';

export const browserSupportBannerMessage = `Boulder Best is only supported on Google Chrome ${MIN_CHROME_VERSION} and up. Safari and Firefox are not supported.`;

export const BrowserSupportBanner = () => {
  const [dismissed, setDismissed] = useLocalStorage({
    key: BROWSER_SUPPORT_BANNER_DISMISSED_KEY,
    defaultValue: false,
  });
  const support = getBrowserSupportStatus();

  if (dismissed || support.supported) {
    return null;
  }

  return (
    <Alert
      color="yellow"
      mb="md"
      onClose={() => {
        setDismissed(true);
      }}
      radius="md"
      title={browserSupportBannerTitle}
      variant="light"
      withCloseButton
    >
      <Text fw={600} size="md">
        {browserSupportBannerMessage}
      </Text>
      <Text mt="xs" size="sm">
        You are using {support.browserName}. On Android, install{' '}
        <Anchor
          href="https://www.google.com/chrome/"
          rel="noopener noreferrer"
          size="sm"
        >
          Chrome
        </Anchor>{' '}
        from the Play Store for the best experience.
      </Text>
    </Alert>
  );
};
