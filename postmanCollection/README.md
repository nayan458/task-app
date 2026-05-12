# Postman Collection — TaskFlow API

## Files

- `TaskFlow.postman_collection.json` — request collection with test scripts
- `TaskFlow.postman_environment.json` — environment with `baseUrl` and runtime variables

## Import

1. Open Postman → **Import** → drop both JSON files.
2. Top-right environment selector → choose **TaskFlow Local**.

## Run

Make sure all three services are up first:

```bash
pnpm start:dev:auth
pnpm start:dev:task
pnpm start:dev:gateway
```

### Option A — Collection Runner (recommended)

Right-click the collection → **Run collection**. Run order is fixed inside each folder, and the collection's pre-request script generates a unique email so reruns don't clash with the duplicate-email test.

Run order:

1. **Auth** — register, duplicate-email (409), invalid payload (400), login, wrong password (401), unknown email (401)
2. **Tasks** — missing token (401), create, invalid date (400), create #2, list/filter/search/sort, get, get not-found (404), update, empty update (400), update not-found (404), delete, delete-again (404)
3. **Cross-user authorization** — registers a second user and confirms they get 404 on another user's task (no info leak)

### Option B — Newman (CI / CLI)

```bash
npx newman run postmanCollection/TaskFlow.postman_collection.json \
  -e postmanCollection/TaskFlow.postman_environment.json
```

## Notes

- `accessToken`, `userId`, `taskId`, `secondUserToken`, `foreignTaskId` are written into the collection variables by the test scripts — you don't have to fill them in manually.
- `uniqueEmail` is generated on the first request and reused for the duplicate-email and login tests, so the whole flow is repeatable.
- Authorization defaults to `Bearer {{accessToken}}` at the collection level. Public routes and the cross-user tests override this per-request.
- Wrong-password and unknown-email both return **401** with a generic message — verified to prevent email enumeration.
- Cross-user reads/updates/deletes return **404** (not 403) on purpose — the repository filters by `createdBy` so foreign IDs are indistinguishable from missing ones.
