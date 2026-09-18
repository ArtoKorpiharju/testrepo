# Integration smoke test

`smoke-test.mjs` boots the whole application with Docker Compose - PostgreSQL,
the Spring Boot backend, and the React frontend behind Nginx - the same way a
developer or CI would run it, then checks that:

- the backend responds healthy at `GET /actuator/health`
- the frontend responds with the page shell at `GET /`

The stack is always torn down again at the end, whether the checks pass or fail.

## Requirements

Nothing beyond what you already need to work on this project:

- Docker Desktop / Docker Engine with the Compose plugin
- Node.js (any reasonably current version - only built-in APIs are used)

No `npm install`, no `.env` file, no other setup. If you don't already have a
`.env` in the repo root, the script falls back to its own throwaway Postgres
credentials for the duration of the test run.

## Running it

From the repository root:

```bash
node e2e-tests/smoke-test.mjs
```

or, using the root `package.json` convenience script:

```bash
npm run e2e-tests
```

## Notes

- The test uses its own Docker Compose project name
  (`osaamisenhallinta-smoketest`), so it won't interfere with a dev stack
  started via `docker compose up`. However, it still binds to the same host
  ports (`5173`, `8080`) declared in `docker-compose.yml`, so stop any stack
  already using those ports before running the test.
- The first run builds Docker images and downloads Maven/npm dependencies
  inside the containers, so it can take a few minutes. Subsequent runs are
  faster thanks to Docker's layer cache.
- This is intentionally a basic smoke test (does it load?), not a full
  end-to-end test suite. Wiring it into a CI pipeline is a later step - the
  script needs nothing beyond Docker on the runner, so that should be a short
  follow-up when you're ready for it.
