import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { renderColorSchemeScriptMarkup } from './vite/render-color-scheme-script.js';

const {
  SENTRY_AUTH_TOKEN: sentryAuthToken,
  SENTRY_UPLOAD_SOURCEMAPS: sentryUploadSourcemaps,
  VITE_SENTRY_RELEASE_FRONTEND: sentryRelease,
  SENTRY_ORG: sentryOrg,
  SENTRY_PROJECT_FRONTEND: sentryProjectFrontend,
  // oxlint-disable-next-line node/no-process-env
} = process.env;

const sentrySourceMapUploadConfig =
  sentryUploadSourcemaps === '1' &&
  sentryAuthToken &&
  sentryOrg &&
  sentryProjectFrontend
    ? {
        authToken: sentryAuthToken,
        org: sentryOrg,
        project: sentryProjectFrontend,
      }
    : undefined;

const colorSchemeBootstrapPlugin = (): Plugin => ({
  name: 'color-scheme-bootstrap',
  transformIndexHtml: (html) =>
    html.replace('</head>', `\n ${renderColorSchemeScriptMarkup()} \n </head>`),
});

export default defineConfig(() => {
  // Read at config load time — top-level destructuring can be inlined when Vite bundles this file.
  // oxlint-disable-next-line node/no-process-env
  const tunnelHostname = process.env.TUNNEL_HOSTNAME;

  return {
    build: {
      sourcemap: true,
    },
    plugins: [
      colorSchemeBootstrapPlugin(),
      react(),
      VitePWA({
        registerType: 'prompt',
        manifest: false,
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'icon-192.png',
          'icon-512.png',
          'site.webmanifest',
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          // Replace waiting workers immediately so OAuth fixes reach users without a manual update prompt.
          skipWaiting: true,
          clientsClaim: true,
          // OAuth callbacks are full-page navigations to /api/auth/callback/* — must hit the API Worker.
          navigateFallbackDenylist: [/^\/api/],
          // Never cache API/auth traffic (fetch or navigation); only the denylist above is not enough
          // when an older service worker is still controlling the page.
          runtimeCaching: [
            {
              urlPattern: /\/api\//,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /\/api\//,
              handler: 'NetworkOnly',
              method: 'POST',
            },
          ],
        },
      }),
      cloudflare({ inspectorPort: 9230 }),
      ...(sentrySourceMapUploadConfig
        ? [
            sentryVitePlugin({
              ...sentrySourceMapUploadConfig,
              telemetry: false,
              ...(sentryRelease
                ? { release: { name: sentryRelease, inject: true } }
                : {}),
            }),
          ]
        : []),
    ],
    server: {
      ...(tunnelHostname ? { host: true, allowedHosts: [tunnelHostname] } : {}),
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  };
});
