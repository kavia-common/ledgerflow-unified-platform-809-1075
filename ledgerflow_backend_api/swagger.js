const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Express API',
      version: '1.0.0',
      description: 'A simple Express API documented with Swagger',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
      },
    },
    security: [],
    tags: [
      { name: 'Auth', description: 'Authentication and session management' },
      { name: 'Workspaces', description: 'Workspace management' },
      { name: 'Projects', description: 'Project management within workspaces' },
      { name: 'Permissions', description: 'Workspace roles and project permissions management' },
      { name: 'Environments', description: 'Manage dev/staging/production environment metadata and configuration' },
      { name: 'CI', description: 'Continuous Integration run status and results' },
      { name: 'GitHub', description: 'GitHub integration for linking repositories and receiving webhooks' },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
