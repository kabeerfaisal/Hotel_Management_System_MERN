import { env } from '../config/env.js'
import { getDatabaseState } from '../config/db.js'

/**
 * Liveness/readiness probe.
 * Returns 503 while the database is not connected so orchestrators can react.
 */
export function getHealth(req, res) {
  const database = getDatabaseState()
  const isHealthy = database === 'connected'

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    service: 'luxurystay-api',
    status: isHealthy ? 'ok' : 'degraded',
    environment: env.nodeEnv,
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
}
