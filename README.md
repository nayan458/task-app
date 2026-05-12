# TaskFlow API

A production-grade backend for the **TaskFlow** assignment, implemented as a NestJS monorepo with gRPC for service-to-service communication and a REST API gateway for external clients.

## Architecture

```
┌────────────┐       HTTP / JSON       ┌──────────────┐
│   Client   │ ──────────────────────▶ │ api-gateway  │
└────────────┘                         │  (REST + JWT) │
                                       └──────┬────────┘
                                              │ gRPC (contract-first)
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                       ┌─────────────┐                 ┌──────────────┐
                       │    auth     │                 │ task-manager │
                       │  (gRPC svc) │                 │  (gRPC svc)  │
                       └──────┬──────┘                 └──────┬───────┘
                              └──────────────┬────────────────┘
                                             ▼
                                       ┌──────────┐
                                       │ MongoDB  │
                                       └──────────┘
```

- **api-gateway** — public HTTP surface. Handles validation (`class-validator`), JWT auth (`JwtAuthGuard` calls `Auth.ValidateToken` over gRPC), helmet, rate limiting, swagger, structured logging, and centralized error handling.
- **auth** — gRPC microservice. Owns user registration, login, password hashing, JWT signing/validation.
- **task-manager** — gRPC microservice. Owns CRUD + filter/search/sort over tasks, enforces creator-only updates/deletes.
- **libs/proto** — `.proto` contracts + ts-proto generated TypeScript types + `ProtoModule` for client wiring.
- **libs/config** — typed `ConfigService` with Joi env validation.
- **libs/common** — global exception filter (gRPC↔HTTP), success interceptor, JWT guard, `@CurrentUser()` decorator, `@Public()` decorator.
- **libs/database** — Mongoose connection module.

## Prerequisites

- Node.js 22+
- pnpm 9+
- MongoDB 7 (or Docker)

## Setup

```bash
pnpm install
cp .env.example .env
pnpm proto:gen        # generates libs/proto/src/generated/*.pb.ts
```

Edit `.env` and set at minimum a strong `JWT_SECRET` (≥32 chars).

## Environment variables

| Variable             | Description                                           | Default |
| -------------------- | ----------------------------------------------------- | ------- |
| `NODE_ENV`           | `development` \| `production` \| `test`               | `development` |
| `GATEWAY_HTTP_PORT`  | HTTP port for the api-gateway                         | `3000` |
| `AUTH_GRPC_URL`      | Bind/connect URL for auth gRPC server (`host:port`)   | `0.0.0.0:50051` |
| `TASK_GRPC_URL`      | Bind/connect URL for task gRPC server (`host:port`)   | `0.0.0.0:50052` |
| `MONGO_URI`          | MongoDB connection string                             | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET`         | Signing secret (≥32 chars, **required**)              | — |
| `JWT_EXPIRES_IN`     | Token lifetime (`7d`, `12h`, …)                       | `7d` |
| `THROTTLE_TTL`       | Rate-limit window in seconds                          | `60` |
| `THROTTLE_LIMIT`     | Max requests per window per IP                        | `100` |
| `LOG_LEVEL`          | pino log level                                        | `info` |

## Running locally

Open three terminals (or use a process manager):

```bash
pnpm start:dev:auth          # auth gRPC service
pnpm start:dev:task          # task-manager gRPC service
pnpm start:dev:gateway       # REST gateway (depends on the two above)
```

When the gateway is up:
- Swagger UI: <http://localhost:3000/docs>
- Base URL: <http://localhost:3000/api>

## Running with Docker

```bash
cp .env.example .env
docker compose up --build
```

This brings up MongoDB, both gRPC services, and the gateway on port 3000.

## API surface (handled by gateway)

| Method | Path                  | Auth   | Description                     |
| ------ | --------------------- | ------ | ------------------------------- |
| POST   | `/api/auth/register`  | public | Register user                   |
| POST   | `/api/auth/login`     | public | Login, returns JWT              |
| POST   | `/api/tasks`          | bearer | Create task                     |
| GET    | `/api/tasks`          | bearer | List with paging/filter/sort    |
| GET    | `/api/tasks/:id`      | bearer | Get a single task               |
| PUT    | `/api/tasks/:id`      | bearer | Update (creator only)           |
| DELETE | `/api/tasks/:id`      | bearer | Delete (creator only)           |

### Query parameters for `GET /api/tasks`

`page`, `limit`, `status` (`TODO|IN_PROGRESS|DONE`), `priority` (`LOW|MEDIUM|HIGH`), `search` (matches title), `sortBy`, `order` (`asc|desc`).

### Response shape

Success responses are wrapped:

```json
{ "success": true, "data": { ... } }
```

Error responses:

```json
{ "success": false, "message": "Task not found" }
```

## Regenerating proto types

After editing any `.proto` in `libs/proto/src/proto/`:

```bash
pnpm proto:gen
```

## Project structure

```
apps/
  api-gateway/      # REST → gRPC entrypoint
  auth/             # gRPC AuthService (stubs — implemented separately)
  task-manager/     # gRPC TaskService (stubs — implemented separately)
libs/
  proto/            # .proto files + ts-proto generated types + ProtoModule
  config/           # Joi-validated typed ConfigService
  common/           # filters, interceptors, guards, decorators
  database/         # Mongoose connection module
scripts/
  generate-proto.js # protoc + ts-proto codegen
```

## Assumptions

- The `auth` service is the source of truth for JWTs. The gateway never decodes tokens locally — it calls `AuthService.ValidateToken` via gRPC. This keeps the JWT secret confined to one service and makes it trivial to add token revocation later.
- gRPC traffic is internal — no TLS in the compose setup. In production, terminate TLS at the gateway and use mTLS or a service mesh between services.
- Dates are strings in the proto (RFC3339) to keep the contract language-agnostic; conversion happens at the storage boundary in the task-manager service.
- Pagination defaults: `page=1`, `limit=10`, hard cap `limit=100`.
