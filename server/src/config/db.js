import mongoose from 'mongoose'

import { env } from './env.js'

const READY_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

export const getDatabaseState = () =>
  READY_STATE_LABELS[mongoose.connection.readyState] ?? 'unknown'

export async function connectDB() {
  mongoose.connection.on('error', (error) => {
    console.error(`[db] connection error: ${error.message}`)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected')
  })

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  })

  console.log(`[db] connected to "${mongoose.connection.name}"`)
  return mongoose.connection
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.connection.close()
  console.log('[db] connection closed')
}
