import { createApiClient } from '@boulder/api-contract';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/';

export const apiClient = createApiClient(apiBaseUrl);
