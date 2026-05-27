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
import { ThemeSwitcher } from '../components/theme-switcher.js';
import {
  useBrowserOnline,
  useManualOfflineMode,
  useTimerDisplayMilliseconds,
} from '../lib/settings/index.js';

export const SettingsPage = () => {
  const { enabled: manualOfflineMode, setEnabled: setManualOfflineMode } =
    useManualOfflineMode();
  const {
    enabled: showTimerMilliseconds,
    setEnabled: setShowTimerMilliseconds,
  } = useTimerDisplayMilliseconds();
  const isOnline = useBrowserOnline();
  const autoSyncBlocked = manualOfflineMode || !isOnline;

  return (
    <Container size="sm">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Settings</Title>
          <Text c="dimmed" size="sm">
            Control offline behavior and see whether sessions can sync
            automatically.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Stack gap="xs">
            <Text fw={600}>Appearance</Text>
            <Text c="dimmed" size="sm">
              Choose light, dark, or match your device setting. Your choice is
              saved on this device.
            </Text>
            <ThemeSwitcher />
          </Stack>

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

          <Group justify="space-between">
            <div>
              <Text fw={600}>Show milliseconds on timers</Text>
              <Text c="dimmed" size="sm">
                Adds millisecond precision to active timer displays on this
                device.
              </Text>
            </div>
            <Switch
              checked={showTimerMilliseconds}
              onChange={(event) => {
                setShowTimerMilliseconds(event.currentTarget.checked);
              }}
              aria-label="Show milliseconds on timers"
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
