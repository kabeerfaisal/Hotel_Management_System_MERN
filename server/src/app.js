import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import apiRoutes from './routes/index.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  // Security headers
  app.use(helmet())

  // Only the configured client origin may call the API with credentials.
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  )

  if (!env.isProduction) {
    app.use(morgan('dev'))
  }

  // Body parsing with a small limit — this API never expects large payloads.
  app.use(express.json({ limit: '16kb' }))
  app.use(express.urlencoded({ extended: true, limit: '16kb' }))

  app.use('/api', apiRoutes)

  // 404 + centralized error handling must come last.
  app.use(notFound)
  app.use(errorHandler)

  return app
}
