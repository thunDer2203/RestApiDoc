// src/router.ts
import { Router as ExpressRouter} from 'express';
import type { RequestHandler } from 'express';
import { z, ZodType } from 'zod';

// This is what we store per-route — our version of FastAPI's self.routes
export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  params?: ZodType;   // path params, e.g. /items/:id
  query?: ZodType;     // query string
  body?: ZodType;      // request body
  summary?: string;
  handler: RequestHandler;
}

// The global registry — same role as FastAPI's self.routes list
export const routeRegistry: RouteDefinition[] = [];

// Wraps express.Router() so every .get/.post call is intercepted and logged

export const createDocRouter = () => {
  const router = ExpressRouter();

    (['get', 'post', 'put', 'patch', 'delete'] as const).forEach((method) => {
    const original = router[method].bind(router);

    // Override router.get/post/etc with our own version
    (router as any)[method] = (
      path: string,
      schemas: { params?: ZodType; query?: ZodType; body?: ZodType; summary?: string },
      handler: RequestHandler
    ) => {
      // 1. Save it to our registry (this is our "route registration phase")
      routeRegistry.push({ method, path, ...schemas, handler });
    //   console.log('Route registry initialization with', routeRegistry[0].params);
      // 2. Wrap the handler so it validates using the same schemas before running
      const validatingHandler: RequestHandler = (req, res, next) => {
        try {
          if (schemas.params) req.params = schemas.params.parse(req.params) as any;
          if (schemas.query) req.query = schemas.query.parse(req.query) as any;
          if (schemas.body) req.body = schemas.body.parse(req.body);
          handler(req, res, next);
        } catch (err) {
          res.status(422).json({ error: (err as Error).message });
        }
      };

      // 3. Actually register it with real Express, like nothing happened
      return original(path, validatingHandler);
    };
  });
//   console.log('Route registry initialized with', routeRegistry);
  return router;
}