import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Hello Hono!'));

// oxlint-disable-next-line import/no-default-export
export default app;
