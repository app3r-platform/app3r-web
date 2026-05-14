import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30_000,
    setupFiles: ['./tests/setup.ts'],
    // Run tests sequentially to avoid DB conflicts
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // Sub-CMD-2: coverage config (target ≥ 60%)
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/routes/**/*.ts'],
      exclude: [
        'src/lib/cron.ts',   // requires running DB + cron — excluded from unit cov
        'src/db/**',
        'src/load-env.ts',
        'src/index.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      reporter: ['text', 'html', 'lcov'],
    },
  },
})
