import {
  Badge,
  Container,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { SyncQueuePanel } from '../components/sync-queue-panel.js';
import {
  useBrowserOnline,
  useManualOfflineMode,
} from '../lib/settings/index.js';

export const SettingsPage = () => {
  const { enabled: manualOfflineMode, setEnabled: setManualOfflineMode } =
    useManualOfflineMode();
  const isOnline = useBrowserOnline();
  const autoSyncBlocked = manualOfflineMode || !isOnline;

  return (
    <Container py="xl" size="sm">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Settings</Title>
          <Text c="dimmed" size="sm">
            Control offline behavior and see whether sessions can sync
            automatically.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Group justify="space-between">
            <div>
              <Text fw={600}>Manual offline mode</Text>
              <Text c="dimmed" size="sm">
                Prevents automatic sync and retries until you turn this off.
              </Text>
            </div>
            <Switch
              checked={manualOfflineMode}
              onChange={(event) => {
                setManualOfflineMode(event.currentTarget.checked);
              }}
              aria-label="Manual offline mode"
            />
          </Group>

          <Group gap="xs">
            <Badge color={isOnline ? 'green' : 'gray'} variant="light">
              Browser {isOnline ? 'online' : 'offline'}
            </Badge>
            <Badge
              color={manualOfflineMode ? 'orange' : 'gray'}
              variant="light"
            >
              Manual offline {manualOfflineMode ? 'on' : 'off'}
            </Badge>
          </Group>

          <Text size="sm">
            {autoSyncBlocked
              ? manualOfflineMode && !isOnline
                ? 'Automatic sync is blocked by manual offline mode and your browser is offline.'
                : manualOfflineMode
                  ? 'Automatic sync is blocked until you turn off manual offline mode.'
                  : 'Automatic sync is blocked while your browser is offline.'
              : 'Automatic sync is allowed when you are signed in and sessions are queued.'}
          </Text>

          <SyncQueuePanel />
        </Stack>
      </Stack>
    </Container>
  );
};
