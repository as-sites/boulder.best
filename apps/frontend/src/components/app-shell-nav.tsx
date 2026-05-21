import { NavLink, Stack } from '@mantine/core';
import { Link, useLocation } from '@tanstack/react-router';
import {
  appNavMainItems,
  isAppNavItemActive,
  type AppNavItem,
} from './app-nav-items.js';

interface AppShellNavLinksProps {
  onNavigate?: () => void;
}

const SidebarNavLink = ({
  item,
  isActive,
  onNavigate,
}: {
  item: AppNavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) => (
  <NavLink
    active={isActive}
    aria-current={isActive ? 'page' : undefined}
    component={Link}
    label={item.label}
    leftSection={<item.Icon size={22} />}
    styles={{
      root: {
        borderRadius: 'var(--mantine-radius-sm)',
        padding: '10px 12px',
      },
      label: {
        fontSize: 'var(--mantine-font-size-md)',
      },
    }}
    to={item.to}
    variant="light"
    {...(onNavigate ? { onClick: onNavigate } : {})}
  />
);

export const AppShellMainNavLinks = ({ onNavigate }: AppShellNavLinksProps) => {
  const location = useLocation();

  return (
    <Stack aria-label="Main navigation" component="nav" gap={2} pt="xs">
      {appNavMainItems.map((item) => (
        <SidebarNavLink
          isActive={isAppNavItemActive(location.pathname, item)}
          item={item}
          key={item.to}
          {...(onNavigate ? { onNavigate } : {})}
        />
      ))}
    </Stack>
  );
};
