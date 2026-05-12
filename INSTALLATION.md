# TaskFlow — Installation Guide

End-to-end instructions for setting up, running, and exploring the TaskFlow API on a local machine.

---

## 1. Prerequisites

| Tool      | Version  | Notes |
| --------- | -------- | ----- |
| Node.js   | ≥ 22     | LTS recommended |
| pnpm      | ≥ 9      | `npm i -g pnpm` if missing |
| MongoDB   | 7.x      | Local install **or** Docker |
| Docker    | 24+      | Optional — only if running the full stack via compose |

Verify:

```bash
node --version
pnpm --version
mongosh --version    # or: docker --version
```

---

## 2. Clone & install

```bash
git clone <repo-url> task-app
cd task-app
pnpm install
```

The first install will run `grpc-tools`'s `node-pre-gyp` postinstall to download the `protoc` binary into `node_modules/grpc-tools/bin/`. If it gets skipped (rare, on some shells), run it manually:

```bash
cd node_modules/.pnpm/grpc-tools@*/node_modules/grpc-tools
npx node-pre-gyp install
cd -
```

---

## 3. Generate proto types

The repository ships the `.proto` contracts but not the generated TypeScript. Run codegen once after install (and any time you edit a `.proto`):

```bash
node scripts/generate-proto.js
# or, if pnpm scripts work cleanly in your shell:
pnpm proto:gen
```

This writes `libs/proto/src/generated/auth.pb.ts` and `task.pb.ts`.

---

## 4. Environment configuration

Copy the template:

```bash
cp .env.example .env
```

The same `.env` is read by all three apps (Nest's `ConfigModule.forRoot` defaults to project root). Edit values as needed — at minimum you must set a real `JWT_SECRET`.

### Variables

| Variable             | Description                                                  | Default                                |
| -------------------- | ------------------------------------------------------------ | -------------------------------------- |
| `NODE_ENV`           | `development` \| `production` \| `test`                      | `development`                          |
| `GATEWAY_HTTP_PORT`  | HTTP port the gateway listens on                             | `3000`                                 |
| `AUTH_GRPC_URL`      | `host:port` the auth gRPC server binds to / gateway dials    | `0.0.0.0:50051`                        |
| `TASK_GRPC_URL`      | `host:port` the task gRPC server binds to / gateway dials    | `0.0.0.0:50052`                        |
| `MONGO_URI`          | MongoDB connection string                                    | `mongodb://localhost:27017/taskflow`   |
| `JWT_SECRET`         | **Required.** Signing secret, **≥ 32 characters**            | —                                      |
| `JWT_EXPIRES_IN`     | Token lifetime (`7d`, `12h`, `30m`, `3600s`)                 | `7d`                                   |
| `THROTTLE_TTL`       | Rate-limit window in **seconds**                             | `60`                                   |
| `THROTTLE_LIMIT`     | Max requests per window per IP                               | `100`                                  |
| `LOG_LEVEL`          | pino log level (`fatal`/`error`/`warn`/`info`/`debug`/`trace`/`silent`) | `info`                      |

The `JWT_SECRET` is validated by Joi at startup. If it is missing or shorter than 32 chars, the app refuses to boot with an explicit error. Generate one with:

```bash
openssl rand -hex 32
```

> Note: in `docker-compose.yml`, `MONGO_URI`, `AUTH_GRPC_URL` and `TASK_GRPC_URL` are overridden so containers reach each other by service name (`mongo`, `auth`, `task-manager`).

---

## 5. Start MongoDB

Pick one:

**Option A — local install**

```bash
brew services start mongodb-community@7   # macOS, Homebrew
# or your distro's equivalent
```

**Option B — quick Docker**

```bash
docker run -d --name taskflow-mongo -p 27017:27017 mongo:7
```

Confirm: `mongosh --eval "db.adminCommand('ping')"` should print `{ ok: 1 }`.

---

## 6. Run the services

You need **three** processes — auth (gRPC), task-manager (gRPC), and api-gateway (HTTP). Use three terminals:

```bash
# Terminal 1
pnpm start:dev:auth

# Terminal 2
pnpm start:dev:task

# Terminal 3
pnpm start:dev:gateway
```

When everything is healthy you'll see:

```
[AuthBootstrap]   Auth gRPC microservice listening on 0.0.0.0:50051
[TaskBootstrap]   Task gRPC microservice listening on 0.0.0.0:50052
[GatewayBootstrap] API Gateway listening on http://localhost:3000
```

### Or — full stack via Docker Compose

```bash
docker compose up --build
```

This brings up MongoDB, both gRPC services, and the gateway behind `http://localhost:3000`.

### Production build

```bash
pnpm build:all
pnpm start:prod:auth
pnpm start:prod:task
pnpm start:prod:gateway
```

---

## 7. API documentation

### Swagger UI (interactive)

With `NODE_ENV=development` and the gateway running, open:

```
http://localhost:3000/docs
```

The Swagger UI shows every endpoint, request/response schemas, validation rules, and a **Try it out** button. Use the **Authorize** button (top right) to paste a JWT obtained from `/api/auth/login`.

> Swagger is automatically disabled when `NODE_ENV=production` to avoid leaking schemas.

### OpenAPI JSON

```
http://localhost:3000/docs-json
```

Pipe it into other tools:

```bash
curl -s http://localhost:3000/docs-json -o openapi.json
```

### Postman

A ready-to-run collection lives in `postmanCollection/`:

- `TaskFlow.postman_collection.json` — every endpoint with assertions (happy path + 400/401/404/409 error cases + cross-user authorization checks)
- `TaskFlow.postman_environment.json` — environment with `baseUrl`, auto-populated `accessToken`/`userId`/`taskId`
- `postmanCollection/README.md` — import + run instructions

Headless run with Newman:

```bash
npx newman run postmanCollection/TaskFlow.postman_collection.json \
  -e postmanCollection/TaskFlow.postman_environment.json
```

### Endpoint summary

| Method | Path                  | Auth   | Purpose                          |
| ------ | --------------------- | ------ | -------------------------------- |
| POST   | `/api/auth/register`  | public | Register user                    |
| POST   | `/api/auth/login`     | public | Login, returns JWT               |
| POST   | `/api/tasks`          | bearer | Create task                      |
| GET    | `/api/tasks`          | bearer | List with paging/filter/sort     |
| GET    | `/api/tasks/:id`      | bearer | Get a single task                |
| PUT    | `/api/tasks/:id`      | bearer | Update (creator only)            |
| DELETE | `/api/tasks/:id`      | bearer | Delete (creator only)            |

`GET /api/tasks` supports `page`, `limit` (max 100), `status` (`TODO|IN_PROGRESS|DONE`), `priority` (`LOW|MEDIUM|HIGH`), `search` (case-insensitive substring on `title`), `sortBy` (`createdAt|updatedAt|dueDate|priority|status|title`), `order` (`asc|desc`).

### Response envelope

```jsonc
// Success
{ "success": true, "data": { /* … */ } }

// Error
{ "success": false, "message": "Task not found" }
```

---

## 8. Troubleshooting

| Symptom                                                              | Fix |
| -------------------------------------------------------------------- | --- |
| `Could not locate proto directory`                                   | Run `node scripts/generate-proto.js` once, then start the apps from project root. |
| `spawn .../grpc-tools/bin/protoc ENOENT`                             | The native `protoc` binary wasn't downloaded. Re-run `node-pre-gyp install` inside the grpc-tools package (see step 2). |
| Gateway 401 on every request after login                             | Clock skew — JWT `exp` is in the past. Check system time, regenerate token. |
| `JWT_SECRET length must be at least 32 characters long` at startup   | Set a longer secret in `.env`. Use `openssl rand -hex 32`. |
| `MongoServerSelectionError`                                          | MongoDB isn't reachable. Check `MONGO_URI`, container/service status. |
| Cross-user request returns `404` instead of `403`                    | This is **intentional** — see assumption #4 below. |

---

## 9. Assumptions

1. **Auth ownership of JWTs.** The `auth` service owns user persistence, password hashing, JWT signing, and the gRPC `ValidateToken` RPC. The gateway no longer round-trips for every request — it verifies tokens locally with passport-jwt using the same shared `JWT_SECRET`. The `ValidateToken` RPC is kept for future internal callers (e.g. another microservice that doesn't hold the JWT secret).

2. **Shared `JWT_SECRET`.** Because the gateway verifies tokens locally, both `auth` and `api-gateway` read the same `JWT_SECRET` from the same `.env`. In a real deployment, distribute the secret via a secrets manager and rotate it together.

3. **Gateway is the only public surface.** Only `api-gateway` exposes HTTP. `auth` and `task-manager` listen on plain gRPC and are assumed to be reachable only from inside the trusted network (Docker network in compose, VPC in production). No TLS between services in this setup — terminate TLS at the gateway, add mTLS or a service mesh for prod.

4. **404 vs 403 for cross-user access.** Reading, updating, or deleting a task that belongs to another user returns `404 Not Found`, not `403 Forbidden`. The repository filters by `createdBy` at the query level, so a foreign task ID is indistinguishable from a non-existent one. This avoids leaking the existence of resources the caller can't see.

5. **Dates are RFC 3339 strings on the wire.** The proto contracts use `string` (e.g. `"2026-12-31T23:59:59.000Z"`) for `dueDate`, `createdAt`, `updatedAt` to keep the IDL language-agnostic. Conversion to `Date` happens at the Mongoose boundary in `task-manager`.

6. **Pagination caps.** `page` defaults to `1`, `limit` defaults to `10`, hard cap `100`. Anything past 100 is clamped server-side.

7. **Search is title-only, substring, case-insensitive.** Implemented as a regex with special characters escaped to prevent ReDoS. A text index on `title` is created so it can be promoted to a `$text` search later without a migration.

8. **Sort field allowlist.** `sortBy` is validated against `{createdAt, updatedAt, dueDate, priority, status, title}`. Anything else falls back silently to `createdAt` to prevent NoSQL injection through sort keys.

9. **Validation lives at boundaries.**
   - **Gateway** — `class-validator` DTOs reject malformed/extra fields with `400` before any gRPC call leaves the box (`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`).
   - **Service layer** — `gRPC` handlers re-validate ownership and IDs because services may be called by clients other than this gateway.

10. **Generic auth errors.** Both wrong password and unknown email return `401 Invalid email or password`. This prevents email enumeration.

11. **Bcrypt cost = 12.** Hard-coded in `apps/auth/src/auth.service.ts`. Increase if you have CPU budget; decrease only with a security review.

12. **No refresh tokens.** Out of scope for this assignment. JWTs are stateless and expire per `JWT_EXPIRES_IN`. To revoke a session you'd add a token blacklist or rotate the secret.

13. **Logs scrub sensitive fields.** pino is configured to redact `req.headers.authorization` and `req.body.password`. Never log the JWT secret or raw passwords.

14. **One Mongo database, two collections.** `users` (owned by `auth`) and `tasks` (owned by `task-manager`) live in the same `taskflow` database for local convenience. In a stricter deployment each service should have its own database with no cross-DB queries — the code is already structured that way (each service has its own Mongoose model and repository).
