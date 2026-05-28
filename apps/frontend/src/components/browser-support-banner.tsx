import { Alert, Anchor, Stack, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  BROWSER_SUPPORT_BANNER_DISMISSED_KEY,
  browserSupportBannerDetails,
  browserSupportBannerSummary,
  CHROME_DOWNLOAD_URL,
  getBrowserSupportStatus,
} from '../lib/browser-support.js';

export const browserSupportBannerTitle = 'Unsupported browser';

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
      <Stack gap="xs">
        <Text fw={600} size="md">
          {browserSupportBannerSummary}
        </Text>
        <Text size="sm">{browserSupportBannerDetails}</Text>
        <Text size="sm">
          You are using {support.browserName}. Get Google Chrome at{' '}
          <Anchor
            href={CHROME_DOWNLOAD_URL}
            rel="noopener noreferrer"
            size="sm"
          >
            google.com/chrome
          </Anchor>
          .
        </Text>
      </Stack>
    </Alert>
  );
};
