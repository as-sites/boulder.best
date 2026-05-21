import {
  Group,
  SegmentedControl,
  Text,
  useMantineColorScheme,
  type MantineColorScheme,
} from '@mantine/core';
import { MonitorIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { themePreferenceLabels } from '../lib/theme/index.js';

const themeOptions: Array<{
  value: MantineColorScheme;
  Icon: typeof SunIcon;
}> = [
  { value: 'light', Icon: SunIcon },
  { value: 'dark', Icon: MoonIcon },
  { value: 'auto', Icon: MonitorIcon },
];

export const ThemeSwitcher = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <SegmentedControl
      aria-label="Color scheme"
      data={themeOptions.map(({ value, Icon }) => ({
        value,
        label: (
          <Group gap={6} justify="center" wrap="nowrap">
            <Icon aria-hidden size={16} />
            <Text component="span" size="sm">
              {themePreferenceLabels[value]}
            </Text>
          </Group>
        ),
      }))}
      fullWidth
      onChange={(value) => {
        setColorScheme(value);
      }}
      value={colorScheme}
    />
  );
};
