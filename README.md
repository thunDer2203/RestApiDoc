# expressapidoc

FastAPI-style interactive API docs for Express, generated from your [Zod](https://zod.dev) schemas.

Define each route's params, query and body once as Zod schemas. You get:

- **Request validation**: invalid requests are rejected with a `422` before your handler runs.
- **Type coercion**: `z.coerce.number()` turns the URL string `"42"` into the number `42` before your code sees it.
- **A live OpenAPI 3 spec** at `/openapi.json`.
- **A Swagger UI page** at `/docs`, with "Try it out" buttons.

You write no OpenAPI YAML, no JSDoc annotations and no Swagger setup code.

> **Status: v0.1, early release.** Please read [Limitations](#limitations) before using it in a real project.

## Install

```bash
npm install expressapidoc express zod
```

`express` (v4) and `zod` (v3) are peer dependencies, so your project keeps control of their versions.

## Quick start

```js
import express from 'express';
import { z } from 'zod';
import { createDocRouter, mountDocs } from 'expressapidoc';

const app = express();
app.use(express.json());

const router = createDocRouter();

// router.<method>(path, schemas, handler)
router.get('/hello', {}, (req, res) => {
  res.json({ message: 'hi' });
});

router.get(
  '/items/:id',
  {
    params: z.object({ id: z.coerce.number() }),
    query: z.object({ q: z.string().optional() }),
    summary: 'Get an item by id',
  },
  (req, res) => {
    res.json({ id: req.params.id, q: req.query.q }); // id is a real number here
  }
);

router.post(
  '/items',
  { body: z.object({ name: z.string(), price: z.number() }) },
  (req, res) => {
    res.json(req.body); // already validated
  }
);

app.use(router);
mountDocs(app);

app.listen(3000, () => console.log('Docs at http://localhost:3000/api-docs'));
```

Open `http://localhost:3000/api-docs` and every route above is listed with its parameters and request body.

## API

### `createDocRouter()`

Returns an Express router. Use it like `express.Router()`, with one difference: `get`, `post`, `put`, `patch` and `delete` take **three arguments**:

```ts
router.get(path, schemas, handler)
```

| Argument  | Description |
|-----------|-------------|
| `path`    | Express path, e.g. `/items/:id` |
| `schemas` | `{ params?, query?, body?, summary? }`. Every field is optional. Pass `{}` for a route with no validation. |
| `handler` | A normal Express handler `(req, res, next) => {}` |

If a schema is provided and the incoming data does not match it, the request is answered with HTTP `422` and the Zod issues, and your handler is not called.

### `mountDocs(app, path = '/docs')`

Adds two endpoints to your app:

- `GET /openapi.json`: the OpenAPI spec, built when the request arrives, so it always reflects every route registered by then.
- `GET <docsPath>`: the Swagger UI page.

Call it before or after your routes; the order doesn't matter.

### `generateOpenApiSpec(title?, version?)`

Returns the OpenAPI document as a plain object, in case you want to write it to a file or serve it yourself.

## How it works

The design follows the pipeline FastAPI uses:

| Step | FastAPI | expressapidoc |
|------|---------|---------------|
| 1. Capture routes | `@app.get(...)` decorators append to `app.routes` | `createDocRouter()` wraps `router.get/post/...` and pushes each route into an internal registry |
| 2. Describe inputs | Python type hints + Pydantic models | Zod schemas passed explicitly (TypeScript types don't exist at runtime) |
| 3. Validate | Pydantic returns `422` on mismatch | The wrapped handler calls `schema.parse(...)` and returns `422` on failure |
| 4. Build the spec | Walks routes and builds `openapi.json` on first request | Converts each Zod schema with `zod-to-json-schema` and assembles OpenAPI 3 |
| 5. Show the UI | `/docs` is Swagger UI pointed at `/openapi.json` | Same: `swagger-ui-express` fetches `/openapi.json` |

The spec is generated when `/openapi.json` is requested, not at startup. By then your whole app file has run and every route is registered, so `mountDocs(app)` works wherever you put it.

## Limitations

- **Register the router directly on the app**: `app.use(router)`. Mounting under a prefix, such as `app.use('/api', router)`, is not supported yet. The docs would show `/hello` while the real endpoint is `/api/hello`.
- **Three-argument form only.** `router.get('/x', handler)` does not work; use `router.get('/x', {}, handler)`.
- **Only routes created with `createDocRouter()` appear in the docs.** Plain `app.get(...)` routes are not tracked.
- **Only `get`, `post`, `put`, `patch` and `delete`** are wrapped. `router.use`, `router.all` and `router.route` are not.
- **Express 4 and Zod 3 only.** Express 5 and Zod 4 are not supported yet.
- **ESM only.** Use `import`, not `require`.
- **Response schemas are not documented.** Every route shows generic `200` and `422` responses.

## Roadmap

- Support for mounting routers under a prefix
- Response schemas
- Optional two-argument form for routes without schemas
- Express 5 and Zod 4 support

## Development

```bash
git clone https://github.com/thunDer2203/RestApiDoc.git
cd expressapidoc
npm install
npm test        # run the test suite (Vitest + Supertest)
npm run build   # compile TypeScript to dist/
```

## License

[MIT](./LICENSE)