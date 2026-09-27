import swaggerUi from 'swagger-ui-express';
import { generateOpenApiSpec } from './open-api.js';
export const mountDocs = (app, path = '/api-docs') => {
    app.get('/openapi.json', (req, res) => {
        res.json(generateOpenApiSpec()); // reads routeRegistry fresh, every request
    });
    app.use(path, swaggerUi.serve, swaggerUi.setup(null, {
        swaggerOptions: { url: '/openapi.json' },
    }));
};
export default mountDocs;
