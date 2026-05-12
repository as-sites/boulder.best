import { createApiContract } from '@boulder/api-contract';

const app = createApiContract({
  hello: () => ({
    message: 'Hello from the Boulder API.',
  }),
});

// oxlint-disable-next-line import/no-default-export
export default app;
