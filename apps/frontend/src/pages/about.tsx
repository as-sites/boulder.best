import type { ReactNode } from 'react';
import {
  Accordion,
  Anchor,
  Container,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import {
  CHROME_DOWNLOAD_URL,
  MIN_CHROME_VERSION,
} from '../lib/browser-support.js';

interface FaqItem {
  question: string;
  answer: ReactNode;
}

const faqItems: FaqItem[] = [
  {
    question: 'What is Boulder Best?',
    answer: (
      <Text size="sm">
        Boulder Best is an offline-first web app for logging bouldering gym
        sessions: climbs, breaks, grades, notes, and photos. You can use it in
        the browser or install it as a progressive web app (PWA) on your phone
        or desktop.
      </Text>
    ),
  },
  {
    question: 'How is my data stored on this device?',
    answer: (
      <Text size="sm">
        Active drafts, finished sessions waiting to sync, cached gym lists, and
        climb photos are kept in your browser&apos;s IndexedDB database on this
        device. Photos are stored as files (blobs), not embedded in session
        JSON. The app also asks the browser for persistent storage when possible
        so your data is less likely to be cleared under storage pressure.
      </Text>
    ),
  },
  {
    question: 'How does offline mode work?',
    answer: (
      <Text size="sm">
        You can start and finish sessions without a network connection. While
        offline, everything stays on this device. When you are back online (and
        not blocking sync in{' '}
        <Anchor component={Link} size="sm" to="/settings">
          Settings
        </Anchor>
        ), finished sessions in the sync queue upload automatically if you are
        signed in. You can also sync manually from the account menu.
      </Text>
    ),
  },
  {
    question: 'When does data sync to the cloud?',
    answer: (
      <Text size="sm">
        After you end a session, it is added to a local sync queue. The app
        uploads session details and any photos when you are signed in, the
        browser is online, and manual offline mode is off. Sync retries with
        backoff if something fails; you can force a retry from Settings.
      </Text>
    ),
  },
  {
    question: 'Do I need an account?',
    answer: (
      <Text size="sm">
        No account is required to log sessions locally. Sign in when you want
        sessions backed up to your account and visible in History across
        devices. Guest sessions remain on this device until you sign in and
        sync.
      </Text>
    ),
  },
  {
    question: 'Where are climb photos stored?',
    answer: (
      <Text size="sm">
        Photos you attach during a session are saved locally first. When a
        session syncs successfully, images are uploaded to secure cloud storage
        and linked to that session on the server.
      </Text>
    ),
  },
  {
    question: 'What browsers are supported?',
    answer: (
      <Text size="sm">
        Boulder Best is supported on Google Chrome version {MIN_CHROME_VERSION}{' '}
        and newer. Safari is not supported. Firefox may work but is not
        supported. Samsung Internet, Microsoft Edge, and other browsers are not
        supported. Progressive web app install is only available in supported
        Chrome versions. Download Chrome at{' '}
        <Anchor href={CHROME_DOWNLOAD_URL} rel="noopener noreferrer" size="sm">
          google.com/chrome
        </Anchor>
        .
      </Text>
    ),
  },
  {
    question: 'How do session timers work?',
    answer: (
      <Text size="sm">
        Timers use real timestamps rather than counting seconds in the
        background. Elapsed time is calculated from when a climb or break
        started plus any paused duration, so the clock stays accurate even if
        you switch tabs or the screen sleeps.
      </Text>
    ),
  },
  {
    question: 'What happens if I clear browser data?',
    answer: (
      <Text size="sm">
        Clearing site data for this app removes local drafts, the sync queue,
        cached gyms, and photos that have not been uploaded yet. Sessions that
        already synced to your account remain in History. Sign in and sync
        regularly if you want a cloud backup.
      </Text>
    ),
  },
];

export const AboutPage = () => (
  <Container size="sm">
    <Stack gap="lg">
      <Stack gap="xs">
        <Title order={1}>About</Title>
        <Text c="dimmed" size="sm">
          How Boulder Best handles your sessions, storage, and sync.
        </Text>
      </Stack>

      <Accordion chevronPosition="right" variant="separated">
        {faqItems.map((item) => (
          <Accordion.Item key={item.question} value={item.question}>
            <Accordion.Control>{item.question}</Accordion.Control>
            <Accordion.Panel>{item.answer}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  </Container>
);
