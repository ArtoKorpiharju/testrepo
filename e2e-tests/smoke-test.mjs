#!/usr/bin/env node
/**
 * Integration smoke test for Osaamisenhallinta.
 *
 * What it does:
 *   1. Builds and starts the full stack (Postgres, backend, frontend/nginx) with
 *      Docker Compose - the same way a developer or CI would run the app.
 *   2. Waits for the backend health endpoint and the frontend page to respond.
 *   3. Tears the stack back down (always, even on failure).
 *
 * Requirements: Docker Desktop / Docker Engine with the Compose plugin, and Node.js
 * (both already required to work on this project). Nothing needs to be installed
 * separately - no `npm install`, no `.env` file required. If POSTGRES_DB /
 * POSTGRES_USER / POSTGRES_PASSWORD aren't already set in the environment, this
 * script supplies its own throwaway defaults so the stack can boot on a clean
 * checkout with zero setup.
 *
 * Run from anywhere in the repo:
 *   node e2e-tests/smoke-test.mjs
 *   npm run e2e-tests        (from the repo root)
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// Isolated project name so this never collides with a dev stack the developer
// already has running under `docker compose up` (default project name).
const PROJECT = "osaamisenhallinta-smoketest";

const env = {
  ...process.env,
  POSTGRES_DB: process.env.POSTGRES_DB ?? "smoketest",
  POSTGRES_USER: process.env.POSTGRES_USER ?? "smoketest",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? "smoketest",
};

const BACKEND_HEALTH_URL = "http://localhost:8080/actuator/health";
const FRONTEND_URL = "http://localhost:5173/";

// A cold `mvn spring-boot:run` (no cached ~/.m2) can take a while to download
// dependencies on the first run, so we poll patiently instead of relying on
// Docker Compose's own healthcheck-based --wait (which gives up too early).
const MAX_WAIT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

function dockerCompose(args) {
  console.log(`\n$ docker compose -p ${PROJECT} ${args.join(" ")}`);
  const result = spawnSync("docker", ["compose", "-p", PROJECT, ...args], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

function cleanup() {
  dockerCompose(["down", "-v", "--remove-orphans"]);
}

async function waitForOk(name, url, isReady) {
  const deadline = Date.now() + MAX_WAIT_MS;
  let lastError = "no attempt made yet";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const body = await res.text();
      if (res.ok && isReady(body)) {
        console.log(`PASS: ${name} responded as expected (${url})`);
        return true;
      }
      lastError = `HTTP ${res.status}, response body did not match expectations`;
    } catch (err) {
      lastError = err.message;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  console.error(`FAIL: ${name} never became ready at ${url} (${lastError})`);
  return false;
}

async function main() {
  console.log("Building and starting the full stack (db, backend, frontend)...");
  const upStatus = dockerCompose(["up", "-d", "--build"]);
  if (upStatus !== 0) {
    console.error("docker compose up failed - see output above.");
    process.exitCode = 1;
    return;
  }

  const backendOk = await waitForOk("Backend", BACKEND_HEALTH_URL, (body) =>
    body.includes('"status":"UP"')
  );
  const frontendOk = await waitForOk("Frontend", FRONTEND_URL, (body) =>
    body.includes('id="root"')
  );

  if (!backendOk || !frontendOk) {
    console.error("\nOne or more services did not come up. Recent container logs:");
    dockerCompose(["logs", "--tail", "100"]);
    process.exitCode = 1;
    return;
  }

  console.log("\nBackend and frontend both loaded successfully.");
}

try {
  await main();
} finally {
  console.log("\nTearing down the stack...");
  cleanup();
}

process.exit(process.exitCode ?? 0);
