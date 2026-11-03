# Task API

![CI](https://github.com/task-challenge-2026/task-api/actions/workflows/ci.yml/badge.svg)

Backend for a task management system that lets HMCTS caseworkers create, view, update and delete their tasks. Built for the [DTS developer challenge](https://github.com/hmcts/dts-developer-challenge).

Interactive API documentation is available at **`/api-docs`** once the app is running.

## Quick start

**Requirements:** Node.js 20.12 or later (developed on Node 22) and Docker.

```bash
cp .env.example .env
docker compose up -d        # starts Postgres 16 and creates the tasks and tasks_test databases
npm install
npm run migrate             # set up the dev database
npm run dev                 # http://localhost:4000
```

Open http://localhost:4000/api-docs to explore and try every endpoint.

Run the tests:

```bash
npm run migrate:test        # set up the test database (first time only)
npm test
```

## API overview

| Method   | Endpoint                   | Description                             | Success |
| -------- | -------------------------- | --------------------------------------- | ------- |
| `POST`   | `/api/v1/tasks`            | Create a task                           | `201`   |
| `GET`    | `/api/v1/tasks`            | List tasks (sort, order, status filter) | `200`   |
| `GET`    | `/api/v1/tasks/:id`        | Get a task                              | `200`   |
| `PATCH`  | `/api/v1/tasks/:id/status` | Update a task's status                  | `200`   |
| `DELETE` | `/api/v1/tasks/:id`        | Delete a task                           | `204`   |
| `GET`    | `/health`                  | Health check                            | `200`   |

Example:

```bash
curl -X POST http://localhost:4000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Review case bundle","status":"TODO","dueAt":"2026-12-01T09:00:00Z"}'
```

A task looks like this:

```json
{
  "id": "f45290f0-bf87-4d6b-8b00-2f50ab119fb8",
  "title": "Review case bundle",
  "description": "",
  "status": "TODO",
  "dueAt": "2026-12-01T09:00:00.000Z",
  "createdAt": "2026-11-02T18:14:32.818Z",
  "updatedAt": "2026-11-02T18:14:32.818Z",
  "isOverdue": false
}
```

Statuses: `TODO`, `IN_PROGRESS`, `ON_HOLD`, `DONE`.

### Errors

Every error uses the same shape, with a machine-readable code and field-level details for validation:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields",
    "details": [{ "field": "title", "code": "REQUIRED", "message": "Field is required" }]
  }
}
```

| Status | Code                | When                                                  |
| ------ | ------------------- | ----------------------------------------------------- |
| 400    | `MALFORMED_JSON`    | Body is not valid JSON                                |
| 404    | `NOT_FOUND`         | No task with that id (including invalid UUIDs)        |
| 404    | `ROUTE_NOT_FOUND`   | URL or method does not exist                          |
| 413    | `PAYLOAD_TOO_LARGE` | Body too large                                        |
| 422    | `VALIDATION_ERROR`  | Valid JSON that breaks a rule (with `details`)        |
| 500    | `INTERNAL_ERROR`    | Unexpected error; generic message, logged server-side |

## Tech stack

- **Node.js + TypeScript** with **Express 5**
- **PostgreSQL 16** (Docker Compose), with **Knex** for migrations and queries
- **Zod 4** for validation
- **Jest + Supertest** for tests
- **OpenAPI 3** with Swagger UI for documentation
- **GitHub Actions** for CI

## Project structure

```
src/
  app.ts                 Express app (routes, middleware)
  server.ts              Starts the server
  docs.ts                Serves the OpenAPI spec and Swagger UI
  db/                    Database connection and migration runner
  errors/                Error class, error middleware, validation error mapping
  tasks/                 Routes, repository (database access), schemas, statuses
migrations/              Versioned database changes (up and down)
test/                    Unit, integration and API tests
docs/
  openapi.yaml           API specification
  DECISIONS.md           Full design decisions log
```

## Key design decisions

The full reasoning for every decision is in [`docs/DECISIONS.md`](docs/DECISIONS.md). The main ones:

- **UUID ids.** Sequential ids are guessable and reveal how many tasks exist. Any id that is not a valid UUID returns `404` without touching the database.
- **`isOverdue` is calculated, not stored.** A stored flag goes stale as time passes; deriving it means it is always correct. A task is overdue when its due date has passed and it is not `DONE`.
- **Due dates must be in the future on create**, and must include a time zone. Dates are stored and returned in UTC.
- **Consistent, coded errors.** `422` separates well-formed requests that break rules from broken requests (`400`). Unknown fields are rejected so typos are caught, and every invalid field is reported at once so a form can show all errors together.
- **Status sorts in workflow order** (TODO, IN_PROGRESS, ON_HOLD, DONE), not alphabetically, with a fixed tie-break so lists never reorder between requests. Sort and filter values come from an allowlist.
- **`updated_at` is maintained by a database trigger**, so it can never be forgotten on a future update path.
- **Versioned API (`/api/v1`)** so changes can be introduced without breaking existing clients. Lists are wrapped (`{ "tasks": [...] }`) so pagination can be added later.
- **Separate layers.** Routes handle HTTP, the repository handles the database, and schemas handle validation, so each can be tested on its own.

## Testing

Tests run against a real Postgres database (`tasks_test`), separate from development data, and the table is emptied before each test.

- **Unit tests:** validation rules and error mapping, and the database-to-API mapping (including overdue logic with an injected clock).
- **Integration tests:** the repository against Postgres.
- **API tests:** every endpoint through HTTP, covering success, validation errors, not found, malformed JSON, oversized bodies and the database trigger.
- **Documentation drift test:** fails if a route exists in the code but not in the OpenAPI spec, or the other way round.

CI runs formatting, lint, type checking, migrations and the full test suite on every push.

## What I would do next

- **Authentication and authorisation**, so caseworkers only see their own tasks (for example through HMCTS identity and access management).
- **Pagination** on the list endpoint for large caseloads.
- **Security headers with `helmet`** and rate limiting.
- **An admin-only bulk import** with audit logging for historic tasks, which the create endpoint deliberately does not allow.
- **Structured logging and monitoring** in place of `console.error`.

## AI assistance

I used Claude (Anthropic) as a pair programmer during this project: to discuss options, explain libraries and patterns, suggest test cases and review my code. I made the design decisions recorded in `docs/DECISIONS.md`, wrote and reviewed the code, and can explain every part of it. Debugging notes, such as why the test setup loads environment variables with `util.parseEnv`, are recorded in the decisions log.
