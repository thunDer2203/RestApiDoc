// src/mountDocs.ts
import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiSpec } from './open-api.js';

export const  mountDocs = (app: Express, path = '/api-docs') => {
  app.get('/openapi.json', (req, res) => {
    res.json(generateOpenApiSpec()); // reads routeRegistry fresh, every request
  });

  app.use(path, swaggerUi.serve, swaggerUi.setup(null, {
    swaggerOptions: { url: '/openapi.json' },
  }));
}
export default mountDocs;