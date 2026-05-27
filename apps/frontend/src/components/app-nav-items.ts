import type { ComponentType } from 'react';
import {
  ClockCounterClockwiseIcon,
  GearSixIcon,
  InfoIcon,
  TimerIcon,
} from '@phosphor-icons/react';

export interface AppNavItem {
  label: string;
  to: '/tracker' | '/sessions' | '/settings' | '/about';
  Icon: ComponentType<{ size: number }>;
}

export const appNavMainItems: AppNavItem[] = [
  { label: 'Tracker', to: '/tracker', Icon: TimerIcon },
  { label: 'History', to: '/sessions', Icon: ClockCounterClockwiseIcon },
  { label: 'Settings', to: '/settings', Icon: GearSixIcon },
  { label: 'About', to: '/about', Icon: InfoIcon },
];

/** Mantine `sm` — matches default theme breakpoint for desktop shell nav. */
export const APP_SHELL_DESKTOP_NAV_QUERY = '(min-width: 48em)';

export const isAppNavItemActive = (
  pathname: string,
  item: AppNavItem,
): boolean => pathname === item.to || pathname.startsWith(`${item.to}/`);
