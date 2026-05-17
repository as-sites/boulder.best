export const openApiDocumentConfig = {
  openapi: '3.0.0',
  info: {
    version: '0.0.0',
    title: 'Boulder Best API',
    description:
      'Offline-first bouldering tracker MVP API contract shared between frontend and worker.',
  },
  tags: [
    { name: 'Gyms', description: 'Read-only gym catalog' },
    { name: 'Uploads', description: 'Authenticated R2 presigned uploads' },
    { name: 'Sessions', description: 'Session sync and history' },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'Better Auth session cookie',
      },
    },
  },
};

export const openApiJsonPath = '/openapi.json';
