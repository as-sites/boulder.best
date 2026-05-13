import type { AuthEnvBindings } from '@boulder/auth';

declare global {
  type CloudflareBindings = AuthEnvBindings;
}

export {};
