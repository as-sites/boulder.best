import { Anchor } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { AppBrandMark } from './app-logo.js';

const markHeight = {
  sm: 18,
  md: 22,
  lg: 26,
} as const;

export type AppBrandSize = keyof typeof markHeight;

interface AppBrandProps {
  id?: string;
  onNavigate?: () => void;
  size?: AppBrandSize;
}

export const AppBrand = ({ id, onNavigate, size = 'md' }: AppBrandProps) => (
  <Anchor
    aria-label="boulder.best"
    c="inherit"
    component={Link}
    id={id}
    onClick={onNavigate}
    styles={{
      root: {
        display: 'flex',
        alignItems: 'center',
      },
    }}
    to="/"
    underline="never"
  >
    <AppBrandMark height={markHeight[size]} />
  </Anchor>
);
