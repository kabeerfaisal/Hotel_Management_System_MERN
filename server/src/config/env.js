import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

// Resolve relative to this file so the API works from any working directory.
dotenv.config({ path: path.resolve(currentDir, '../../.env') })

const REQUIRED_VARIABLES = ['MONGO_URI', 'JWT_SECRET']

const missing = REQUIRED_VARIABLES.filter((key) => !process.env[key])

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Copy server/.env.example to server/.env and fill in the values.',
  )
}

const toPort = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback
}

const nodeEnv = process.env.NODE_ENV ?? 'development'

export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: toPort(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
})
