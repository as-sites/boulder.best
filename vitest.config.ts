import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const { GITHUB_WORKSPACE: githubWorkspace, GITHUB_ACTIONS: isGithubActions } =
  // oxlint-disable-next-line node/no-process-env -- this shouldn't rely on the env package to run tests
  process.env;

export default defineConfig({
  test: {
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      reportsDirectory: './coverage',
    },
    // https://vitest.dev/guide/reporters.html#github-actions-reporter
    reporters: isGithubActions
      ? [
          'default',
          [
            'github-actions',
            {
              onWritePath: (path: string) =>
                githubWorkspace && path.startsWith(`${githubWorkspace}/`)
                  ? path.slice(githubWorkspace.length + 1)
                  : path,
            },
          ],
          'junit',
        ]
      : ['default'],
    outputFile: isGithubActions
      ? {
          junit: './test-results/vitest-junit.xml',
        }
      : undefined,
    // Define test projects
    projects: [
      {
        resolve: {
          alias: {
            'virtual:pwa-register/react': resolve(
              'apps/frontend/src/__mocks__/virtual-pwa-register-react.ts',
            ),
          },
        },
        test: {
          name: 'apps/frontend',
          include: ['apps/frontend/tests/**/*.test.{ts,tsx}'],
          environment: 'happy-dom',
          setupFiles: ['./vitest-setup-react.ts'],
        },
      },
      {
        test: {
          name: 'apps/api',
          include: ['apps/api/tests/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'apps/preview-gateway',
          include: ['apps/preview-gateway/tests/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'packages/api-contract',
          include: ['packages/api-contract/tests/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'packages/auth',
          include: ['packages/auth/tests/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'scripts',
          include: ['scripts/tests/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
