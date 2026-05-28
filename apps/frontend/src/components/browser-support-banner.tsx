import { Alert, Anchor, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  BROWSER_SUPPORT_BANNER_DISMISSED_KEY,
  CHROME_DOWNLOAD_URL,
  getBrowserSupportStatus,
  MIN_CHROME_VERSION,
} from '../lib/browser-support.js';

export const browserSupportBannerTitle = 'Unsupported browser';

export const browserSupportBannerMessage = `Boulder Best is only supported on Google Chrome ${MIN_CHROME_VERSION} and up. Safari is not supported. Firefox and iOS may work but are not supported.`;

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
        You are using {support.browserName}. Get Google Chrome at{' '}
        <Anchor href={CHROME_DOWNLOAD_URL} rel="noopener noreferrer" size="sm">
          google.com/chrome
        </Anchor>
        .
      </Text>
    </Alert>
  );
};
