/**
 * index.ts — Server entry point
 * IMPORTANT: load-env MUST be the first import (dotenv before env.ts parses process.env)
 */
import './load-env'
import { serve } from '@hono/node-server'
import { app } from './app'
import { env } from './env'
import { startAllCronJobs } from './lib/cron'
import { validateSdkConfig } from './lib/config'

// Issue B: Boot-time Config Validator — fail-fast in production
validateSdkConfig(env.NODE_ENV)

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`\n🚀 App3R Backend — Phase D-2 Real Integrations`)
    console.log(`   Server  : http://localhost:${info.port}`)
    console.log(`   Health  : http://localhost:${info.port}/health`)
    console.log(`   Docs    : http://localhost:${info.port}/docs`)
    console.log(`   OpenAPI : http://localhost:${info.port}/openapi.json`)
    console.log(`   Env     : ${env.NODE_ENV}\n`)

    // NOTE-M3: start reconciliation cron + ClamAV scan worker
    startAllCronJobs()
  },
)
