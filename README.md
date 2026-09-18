# Osaamisenhallinta

Full-stack application using React, Spring Boot and PostgreSQL.

## Repository structure

- [frontend](./frontend/): React frontend
- [backend](./backend/): Spring Boot backend service

## Current stack

- Frontend: Vite 8, React 19, TypeScript 6, ESLint 10, Prettier 3
- Backend: Java 21, Maven 3.9, Spring Boot 4.1, Checkstyle 3.6, Spotless 3.10
- Database: PostgreSQL 18
- Web server / reverse proxy: Nginx 1.30.4
- Tooling: Docker Compose

## Run with Docker Compose

To run the application with Docker Compose, you need Docker Desktop ([download](https://www.docker.com/products/docker-desktop/)).

1. Create `.env` in the repository root (use `.env.example` as a template):

```env
POSTGRES_DB=database_name
POSTGRES_USER=username
POSTGRES_PASSWORD=password
```

2. Build and run:

```bash
docker compose up --build
```

3. Open `http://localhost:5173`.

## Tests

There are two layers of tests, so you don't need to spin up the whole stack
just to check a small change:

- **Unit tests** - fast, no Docker required, run per project:
  - Frontend: `cd frontend && npm run test` (Vitest + Testing Library; checks
    the app renders without crashing).
  - Backend: `cd backend && ./mvnw test` (`mvnw.cmd test` on Windows; checks
    the Spring Boot application context starts up).
- **Integration smoke test** - boots the full stack (Postgres, backend,
  frontend/Nginx) with Docker Compose and checks that the backend and frontend
  both respond over HTTP. No extra install step needed beyond Docker and Node,
  both of which the project already requires:

  ```bash
  npm run e2e-tests
  ```

  See [`e2e-tests/README.md`](./e2e-tests/README.md) for details.

Run the unit tests while developing day-to-day, and the integration test
before pushing or when you want to confirm the whole stack still boots.
All three run automatically in CI on every push and pull request - see
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
