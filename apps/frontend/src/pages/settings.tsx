import {
  Badge,
  Button,
  Container,
  Group,
  NumberInput,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { SyncQueuePanel } from '../components/sync-queue-panel.js';
import { ThemeSwitcher } from '../components/theme-switcher.js';
import {
  formatVersion,
  LOADED_VERSION,
  useLatestVersion,
} from '../lib/app-version.js';
import { useServiceWorkerUpdate } from '../lib/service-worker/index.js';
import {
  AUTO_REST_DURATION_MAX_MINUTES,
  AUTO_REST_DURATION_MIN_MINUTES,
  useAutoRestTiming,
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
  const {
    enabled: autoRestEnabled,
    setEnabled: setAutoRestEnabled,
    durationMinutes: autoRestDurationMinutes,
    setDurationMinutes: setAutoRestDurationMinutes,
  } = useAutoRestTiming();
  const isOnline = useBrowserOnline();
  const autoSyncBlocked = manualOfflineMode || !isOnline;
  const { needRefresh, update } = useServiceWorkerUpdate();
  const latestVersion = useLatestVersion();
  const loadedShort = formatVersion(LOADED_VERSION);
  const latestShort = latestVersion ? formatVersion(latestVersion) : null;

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

          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Stack gap={4}>
              <Text fw={600}>App version</Text>
              <Text c="dimmed" size="sm">
                {needRefresh
                  ? 'A new version has been downloaded. Reload to apply it.'
                  : 'Reload the app if something seems out of date.'}
              </Text>
              <Text c="dimmed" ff="monospace" size="xs">
                Version:{' '}
                {needRefresh && latestShort
                  ? `${loadedShort} → ${latestShort}`
                  : loadedShort}
              </Text>
            </Stack>
            <Button
              leftSection={<ArrowsClockwiseIcon aria-hidden size={16} />}
              onClick={update}
              size="xs"
              style={{ flexShrink: 0 }}
              variant={needRefresh ? 'filled' : 'default'}
            >
              {needRefresh ? 'Reload now' : 'Reload'}
            </Button>
          </Group>

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

          <Stack gap="xs">
            <Group justify="space-between">
              <div>
                <Text fw={600}>Auto rest timer</Text>
                <Text c="dimmed" size="sm">
                  Automatically starts a break when an attempt timer is stopped.
                </Text>
              </div>
              <Switch
                checked={autoRestEnabled}
                onChange={(event) => {
                  setAutoRestEnabled(event.currentTarget.checked);
                }}
                aria-label="Auto rest timer"
              />
            </Group>
            {autoRestEnabled ? (
              <NumberInput
                label="Rest duration (minutes)"
                value={autoRestDurationMinutes}
                onChange={(value) => {
                  if (typeof value === 'number') {
                    setAutoRestDurationMinutes(value);
                  }
                }}
                min={AUTO_REST_DURATION_MIN_MINUTES}
                max={AUTO_REST_DURATION_MAX_MINUTES}
                step={1}
                allowDecimal={false}
                aria-label="Rest duration in minutes"
              />
            ) : null}
          </Stack>

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

          <Stack gap="xs">
            <Text fw={600}>Session import</Text>
            <Text c="dimmed" size="sm">
              Import one or more Garmin .fit activities into your local session
              history.
            </Text>
            <Group>
              <Button
                component={Link}
                to="/settings/import-garmin-fit"
                variant="light"
              >
                Import Garmin .fit files
              </Button>
            </Group>
          </Stack>

          <SyncQueuePanel />
        </Stack>
      </Stack>
    </Container>
  );
};
