// src/router.ts
import { Router as ExpressRouter } from 'express';
// The global registry — same role as FastAPI's self.routes list
export const routeRegistry = [];
// Wraps express.Router() so every .get/.post call is intercepted and logged
export const createDocRouter = () => {
    const router = ExpressRouter();
    ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
        const original = router[method].bind(router);
        // Override router.get/post/etc with our own version
        router[method] = (path, schemas, handler) => {
            // 1. Save it to our registry (this is our "route registration phase")
            routeRegistry.push({ method, path, ...schemas, handler });
            //   console.log('Route registry initialization with', routeRegistry[0].params);
            // 2. Wrap the handler so it validates using the same schemas before running
            const validatingHandler = (req, res, next) => {
                try {
                    if (schemas.params)
                        req.params = schemas.params.parse(req.params);
                    if (schemas.query)
                        req.query = schemas.query.parse(req.query);
                    if (schemas.body)
                        req.body = schemas.body.parse(req.body);
                    handler(req, res, next);
                }
                catch (err) {
                    res.status(422).json({ error: err.message });
                }
            };
            // 3. Actually register it with real Express, like nothing happened
            return original(path, validatingHandler);
        };
    });
    //   console.log('Route registry initialized with', routeRegistry);
    return router;
};
