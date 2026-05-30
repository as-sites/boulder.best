import { writeFile } from 'node:fs/promises';
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
  VITE_APP_VERSION: appVersionEnv,
  // oxlint-disable-next-line node/no-process-env
} = process.env;

// Set by mise for dev/build tasks; falls back to 'dev' only if vite is invoked
// outside of mise (which this project does not support).
const appVersion = appVersionEnv || 'dev';

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

// Writes dist/version.json (not in the Workbox precache glob, so always
// fetched from the network) and serves it during dev via middleware.
const versionFilePlugin = (): Plugin => ({
  name: 'version-file',
  configureServer(server) {
    server.middlewares.use('/version.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ version: appVersion }));
    });
  },
  async closeBundle() {
    await writeFile(
      'dist/version.json',
      JSON.stringify({ version: appVersion }),
    );
  },
});

export default defineConfig(() => {
  // Read at config load time — top-level destructuring can be inlined when Vite bundles this file.
  // oxlint-disable-next-line node/no-process-env
  const tunnelHostname = process.env.TUNNEL_HOSTNAME;

  return {
    build: {
      sourcemap: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
      colorSchemeBootstrapPlugin(),
      versionFilePlugin(),
      react(),
      VitePWA({
        injectRegister: false,
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
