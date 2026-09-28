import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import  {createDocRouter, routeRegistry } from '../src/routeOverrider.js';

describe('createDocRouter', () => {
  beforeEach(() => {
    routeRegistry.length = 0; // clear the registry between tests so they don't interfere
  });

  it('registers a route with no schema and it works normally', async () => {
    const app = express();
    app.use(express.json());
    const router = createDocRouter();

    router.get('/hello', {}, (req, res) => res.json({ message: 'hi' }));
    app.use(router);

    const res = await request(app).get('/hello');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'hi' });
  });

  it('validates request body and rejects invalid input with 422', async () => {
    const app = express();
    app.use(express.json());
    const router = createDocRouter();

    router.post('/items', { body: z.object({ name: z.string() }) }, (req, res) => {
      res.json(req.body);
    });
    app.use(router);

    const badRes = await request(app).post('/items').send({ name: 123 }); // wrong type
    expect(badRes.status).toBe(422);

    const goodRes = await request(app).post('/items').send({ name: 'Hello' });
    expect(goodRes.status).toBe(200);
    expect(goodRes.body).toEqual({ name: 'Hello' });
  });

  it('pushes the route definition into routeRegistry', () => {
    const router = createDocRouter();
    router.get('/profile', {}, (req, res) => res.json({}));

    expect(routeRegistry).toHaveLength(1);
    expect(routeRegistry[0].method).toBe('get');
    expect(routeRegistry[0].path).toBe('/profile');
  });

  it('validates path params using z.coerce', async () => {
    const app = express();
    const router = createDocRouter();

    router.get('/items/:id', { params: z.object({ id: z.coerce.number() }) }, (req, res) => {
      res.json({ id: req.params.id, type: typeof req.params.id });
    });
    app.use(router);

    const res = await request(app).get('/items/42');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 42, type: 'number' });
  });
});