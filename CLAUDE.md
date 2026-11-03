# Project context for Claude Code

HMCTS DTS Software Developer coding challenge: a task manager for caseworkers (backend API + frontend).
Brief: https://github.com/hmcts/dts-developer-challenge
Design decisions are logged in `docs/DECISIONS.md`. Read it before suggesting changes and keep it in sync.

## Working agreement

- I write the code. Claude explains, reviews, checks against the brief and decisions log, and catches mistakes.
- Explain the "why" behind every suggestion so I can defend it at interview.
- Do not edit files or commit unless I explicitly ask. Prefer giving me code to type and reviewing what I write.
- Small, focused commits with plain messages. No over-engineering: no auth, users or extra infrastructure unless I decide to add it.
- AI assistance is disclosed honestly in the README.

## Anonymity (name-blind application)

- Commits must use `Candidate <candidate@example.com>` (set per repo with `git config`).
- Never add names, emails, company names or personal details to code, comments, README, package.json or commit messages.
- Do not add Co-Authored-By or other attribution lines to commits.

## Stack

- Backend (`task-api`): Node.js + TypeScript, Express 5, Postgres 16 (Docker Compose), Knex (migrations + queries), Zod 4 (validation), Jest + Supertest, OpenAPI docs.
- Frontend (`task-frontend`): HMCTS frontend starter with the GOV.UK Design System.
- Env loaded with `--env-file=.env` (no dotenv).

## Commands (task-api)

- `docker compose up -d` start Postgres
- `npm run migrate` / `npm run migrate:rollback`
- `npm run dev`, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run format`

## Progress

Complete. All endpoints (create, get, list with sort and filter, update status, delete, status history), OpenAPI docs, CI and the status audit trail are implemented and tested. The GOV.UK frontend is in the separate task-frontend repository. Next steps are listed in the README.

## Zod 4 behaviour (verified)

- Missing enum field reports `invalid_value`, not `invalid_type`, so the mapper checks the raw body for missing fields.
- Without `abort: true`, an invalid date also triggers the future-date refine.
- Unknown keys arrive as one `unrecognized_keys` issue with `keys[]` and empty path.
