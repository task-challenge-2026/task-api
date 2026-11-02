# Task API

Backend for a task management system that lets HMCTS caseworkers create, view, update and delete their tasks.

Work in progress. Setup, endpoints and design decisions will be documented here as the API is built.

## Run locally

```bash
cp .env.example .env
docker compose up -d   # starts Postgres
npm install
npm run dev
```

Check it is running: `GET http://localhost:4000/health`

## Scripts

| Command         | What it does                   |
| --------------- | ------------------------------ |
| `npm run dev`   | Start the API with live reload |
| `npm test`      | Run the tests                  |
| `npm run lint`  | Lint the code                  |
| `npm run build` | Compile TypeScript to `dist`   |
