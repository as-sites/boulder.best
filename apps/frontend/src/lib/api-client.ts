import { createApiClient } from '@boulder/api-contract';

// Empty in dev — Vite proxy forwards /api to localhost:8787.
// Leave empty in production when the API Worker is routed at /api on the same origin.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient = createApiClient(apiBaseUrl);
