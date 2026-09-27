import { zodToJsonSchema } from 'zod-to-json-schema';
import { routeRegistry, type RouteDefinition } from './routeOverrider.js';


export const generateOpenApiSpec = (title='API docs',version='1.0.0') =>{
    const paths: Record<string, any> = {};
    for (const route of routeRegistry) {
        const openApiPath = route.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
        if (!paths[openApiPath]) paths[openApiPath] = {};
        const parameters: any[] = [];
        if (route.params) {
            const paramsSchema = zodToJsonSchema(route.params, { target: 'openApi3' }) as any;
            for (const [name, propSchema] of Object.entries(paramsSchema.properties ?? {})) {
                parameters.push({
                            name,
                            in: 'path',
                            required: paramsSchema.required?.includes(name) ?? true,
                            schema: propSchema,
        });
      }
        }

            if (route.query) {
      const schema = zodToJsonSchema(route.query, { target: 'openApi3' }) as any;
      for (const [name, propSchema] of Object.entries(schema.properties ?? {})) {
        parameters.push({
          name,
          in: 'query',
          required: schema.required?.includes(name) ?? false,
          schema: propSchema,
        });
      }
    }
    const requestBody = route.body
      ? {
          content: {
            'application/json': {
              schema: zodToJsonSchema(route.body, { target: 'openApi3' }),
            },
          },
        }
      : undefined;


      paths[openApiPath][route.method] = {
      summary: route.summary ?? `${route.method.toUpperCase()} ${route.path}`,
      parameters: parameters.length ? parameters : undefined,
      requestBody,
      responses: {
        '200': { description: 'Successful response' },
        '422': { description: 'Validation error' },
      },
    };

    }

    return {
    openapi: '3.0.0',
    info: { title, version },
    paths,
  };
}