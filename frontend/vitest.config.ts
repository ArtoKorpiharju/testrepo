import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: vitest bundles its own Vite
// internally, and merging test config into the main vite.config.ts can make
// its Plugin types collide with the project's own Vite version (breaking
// `npm run build`). Vitest automatically picks this file up instead of
// vite.config.ts, so the production config never needs to know vitest exists.
export default defineConfig({
  plugins: [react()],
  // Force the automatic JSX runtime explicitly. Vite normally infers this
  // per-file from the nearest tsconfig that covers it, but test files live
  // under tests/ (outside tsconfig.app.json's "src" include), so that
  // discovery misses them and falls back to the classic runtime, which
  // requires `React` in scope and fails with "React is not defined".
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
