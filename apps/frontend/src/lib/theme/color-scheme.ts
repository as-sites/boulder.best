import {
  localStorageColorSchemeManager,
  type MantineColorScheme,
  type MantineProviderProps,
} from '@mantine/core';

/**
 * Local storage key for the user's color scheme preference (light / dark /
 * auto).
 */
export const COLOR_SCHEME_STORAGE_KEY = 'boulder.colorScheme';

export const DEFAULT_COLOR_SCHEME: MantineColorScheme = 'auto';

export const appColorSchemeManager = localStorageColorSchemeManager({
  key: COLOR_SCHEME_STORAGE_KEY,
});

export const appMantineProviderProps = {
  colorSchemeManager: appColorSchemeManager,
  defaultColorScheme: DEFAULT_COLOR_SCHEME,
} satisfies Pick<
  MantineProviderProps,
  'colorSchemeManager' | 'defaultColorScheme'
>;

export const themePreferenceLabels = {
  light: 'Light',
  dark: 'Dark',
  auto: 'System',
} as const satisfies Record<MantineColorScheme, string>;
