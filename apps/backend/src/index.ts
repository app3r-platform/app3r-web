/**
 * index.ts — Server entry point
 * IMPORTANT: load-env MUST be the first import (dotenv before env.ts parses process.env)
 */
import './load-env'
import { serve } from '@hono/node-server'
import { app } from './app'
import { env } from './env'

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`\n🚀 App3R Backend — Phase D-1`)
    console.log(`   Server  : http://localhost:${info.port}`)
    console.log(`   Health  : http://localhost:${info.port}/health`)
    console.log(`   Docs    : http://localhost:${info.port}/docs`)
    console.log(`   OpenAPI : http://localhost:${info.port}/openapi.json`)
    console.log(`   Env     : ${env.NODE_ENV}\n`)
  },
)
