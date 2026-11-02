# Decisions log: HMCTS caseworker task manager

Running log of design decisions and reasons. Feeds the README's "Decisions and trade-offs" section and interview prep.

## Scope

| Area | Brief requires | Decision |
|---|---|---|
| Create | title, description (optional), status, due date/time | As specified |
| Read | one task by ID, all tasks | `GET /tasks/:id`, `GET /tasks` (list, not search) |
| Update | status only | `PATCH /tasks/:id/status` |
| Delete | one task | `DELETE /tasks/:id` |
| Frontend | full CRUD, user-friendly | GOV.UK Design System via HMCTS frontend starter |
| Technical | tests, database, validation and errors, API docs, README | All in scope |

## Decisions

### 1. No users or authentication
- **Decision:** Not built. The brief has no users or permissions.
- **Why:** Out of scope; adding it is over-engineering for a technical test.
- **Next step (README):** In production, tasks would be scoped to the authenticated caseworker via HMCTS identity and access management.

### 2. Statuses
- **Decision:** `TODO`, `IN_PROGRESS`, `ON_HOLD`, `DONE`.
- **Why:** Small, defensible set. `ON_HOLD` reflects real casework, where tasks stall waiting on parties, evidence or the judiciary.

### 3. Overdue is derived, not stored
- **Decision:** API returns `isOverdue` = `dueAt < now` AND `status != DONE`. UI shows a red GOV.UK tag.
- **Why:** A stored flag goes stale as time passes. Deriving it keeps data consistent with no background jobs.

### 4. Due date cannot be in the past on create
- **Decision:** `POST /tasks` rejects a past `dueAt` with 400 and a clear message.
- **Why:** Prevents data entry errors on new work.
- **Allowed:** Status updates on overdue tasks, so they can be progressed and closed.
- **Next step (README):** Historic or backdated tasks would be loaded through an admin-only bulk import with audit logging, not the standard create endpoint.

### 5. Time zones
- **Decision:** Store `dueAt` in UTC. Display in Europe/London.
- **Why:** Avoids tasks shifting by an hour across clock changes.

### 6. Sorting and filtering on `GET /tasks`
- **Decision:** User-controlled sorting and an optional status filter.
  - `?sort=dueAt|status|createdAt` (default `dueAt`)
  - `?order=asc|desc` (default `asc`)
  - `?status=TODO|IN_PROGRESS|ON_HOLD|DONE` (optional)
- **Why:** Due date matters most, but caseworkers also navigate by status and by when work arrived.
- **Detail:** Status sorts by workflow order (TODO, IN_PROGRESS, ON_HOLD, DONE), not alphabetically.
- **Detail:** Sort and filter values are validated against an allowlist; anything else returns 400. Prevents injection via sort fields and gives clear errors.
- **Next step (README):** Pagination for large caseloads.

## Open
- Pagination: deferred (see 6).
- None beyond pagination.

## AI assistance
- AI used as a pair programmer for scaffolding, test cases and review. Design decisions in this log are mine. To be summarised honestly in the README.

### 7. Stack
- **Decision:** Node.js + TypeScript, Express 5, Postgres (Docker Compose), Jest + Supertest, Zod for validation, OpenAPI for docs. Frontend: HMCTS frontend starter with the GOV.UK Design System.
- **Why:** Node.js and Postgres are on HMCTS's core stack; TypeScript adds type safety; GOV.UK Design System matches how HMCTS builds public services.
- **Detail:** `createApp()` is separate from `server.ts` so tests run against the app without opening a network port.
