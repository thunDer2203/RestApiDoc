import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import  {createDocRouter, routeRegistry } from '../src/routeOverrider.js';
import { generateOpenApiSpec } from '../src/open-api.js';

describe('generateOpenApiSpec', () => {
  beforeEach(() => {
    routeRegistry.length = 0;
  });

  it('produces a valid OpenAPI shape', () => {
    const router = createDocRouter();
    router.get('/hello', {}, (req, res) => res.json({}));

    const spec = generateOpenApiSpec('Test API', '1.0.0');
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info).toEqual({ title: 'Test API', version: '1.0.0' });
    expect(spec.paths['/hello']).toBeDefined();
    expect(spec.paths['/hello'].get).toBeDefined();
  });

  it('converts :param syntax to {param} syntax', () => {
    const router = createDocRouter();
    router.get('/items/:id', { params: z.object({ id: z.coerce.number() }) }, (req, res) => res.json({}));

    const spec = generateOpenApiSpec();
    expect(spec.paths['/items/{id}']).toBeDefined();
    expect(spec.paths['/items/:id']).toBeUndefined();
  });

  it('includes requestBody schema for POST with a body schema', () => {
    const router = createDocRouter();
    router.post('/items', { body: z.object({ name: z.string() }) }, (req, res) => res.json({}));

    const spec = generateOpenApiSpec();
    const postOp = spec.paths['/items'].post;
    expect(postOp.requestBody).toBeDefined();
    expect(postOp.requestBody.content['application/json'].schema.properties.name.type).toBe('string');
  });
});