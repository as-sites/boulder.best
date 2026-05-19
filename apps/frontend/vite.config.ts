import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
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
    cloudflare(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
