# TaskFlow API

A backend service built with Node.js, NestJS, MongoDB, and TypeScript using a microservices architecture with gRPC.

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- MongoDB running locally on port `27017`

## Setup

```bash
# 1. Clone and install
git clone <repo-url> task-app
cd task-app
pnpm install

# 2. Generate proto types
node scripts/generate-proto.js

# 3. Configure environment
cp .env.example .env
```

Edit `.env` and set a `JWT_SECRET` of at least 32 characters:

```bash
openssl rand -hex 32
```

## Environment Variables

| Variable            | Description                              | Default                              |
|---------------------|------------------------------------------|--------------------------------------|
| `MONGO_URI`         | MongoDB connection string                | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET`        | JWT signing secret (min 32 chars)        | —                                    |
| `JWT_EXPIRES_IN`    | Token lifetime                           | `7d`                                 |
| `AUTH_GRPC_URL`     | Auth service gRPC bind address           | `0.0.0.0:50051`                      |
| `TASK_GRPC_URL`     | Task service gRPC bind address           | `0.0.0.0:50052`                      |
| `GATEWAY_HTTP_PORT` | HTTP port for the API gateway            | `3000`                               |

## Running Locally

Start each service in a separate terminal:

```bash
# Terminal 1 — Auth service
pnpm start:dev:auth

# Terminal 2 — Task service
pnpm start:dev:task

# Terminal 3 — API Gateway
pnpm start:dev:gateway
```

API is available at `http://localhost:3000`.

## API Documentation

Swagger UI is available at `http://localhost:3000/docs` when `NODE_ENV=development`.

## Endpoints

| Method | Path                 | Auth   | Description                      |
|--------|----------------------|--------|----------------------------------|
| POST   | `/api/auth/register` | public | Register a new user              |
| POST   | `/api/auth/login`    | public | Login, returns JWT               |
| POST   | `/api/tasks`         | bearer | Create a task                    |
| GET    | `/api/tasks`         | bearer | List tasks with filter/sort/page |
| GET    | `/api/tasks/:id`     | bearer | Get a single task                |
| PUT    | `/api/tasks/:id`     | bearer | Update task (creator only)       |
| DELETE | `/api/tasks/:id`     | bearer | Delete task (creator only)       |

`GET /api/tasks` supports: `page`, `limit`, `status` (`TODO|IN_PROGRESS|DONE`), `priority` (`LOW|MEDIUM|HIGH`), `search` (title substring), `sortBy`, `order` (`asc|desc`).

## Postman

Import `postmanCollection/TaskFlow.postman_collection.json` and `postmanCollection/TaskFlow.postman_environment.json` into Postman. The environment auto-populates the JWT after login.

## Assumptions

- MongoDB must be running before starting any service.
- All three services share the same `.env` file at the project root.
- Cross-user task access returns `404` (not `403`) to avoid leaking resource existence.
- Search is case-insensitive substring match on `title` only.
- Pagination defaults: `page=1`, `limit=10`, max `limit=100`.