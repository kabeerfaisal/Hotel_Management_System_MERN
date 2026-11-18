import { createApp } from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { env } from './config/env.js'

const app = createApp()

function registerShutdownHandlers(server) {
  let isShuttingDown = false

  const shutdown = (signal) => {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log(`[api] ${signal} received — shutting down`)

    server.close(async () => {
      await disconnectDB()
      process.exit(0)
    })

    // Never hang forever on open connections.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  process.on('unhandledRejection', (reason) => {
    console.error('[api] unhandled promise rejection:', reason)
    shutdown('unhandledRejection')
  })
}

async function start() {
  try {
    await connectDB()

    const server = app.listen(env.port, () => {
      console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`)
    })

    registerShutdownHandlers(server)
  } catch (error) {
    console.error(`[api] failed to start: ${error.message}`)
    process.exit(1)
  }
}

start()
