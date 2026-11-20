import 'dotenv/config'

import cors from 'cors'
import express from 'express'

import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import roomRoutes from './routes/roomRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

// ── Middleware ───────────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '16kb' }))

// Lightweight service check (no business routes yet)
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'LuxuryStay Hospitality API',
    status: 'running',
  })
})

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)

// ── Bootstrap ────────────────────────────────────────────────
async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined. Copy server/.env.example to server/.env.')
    }

    await connectDB()

    app.listen(PORT, () => {
      console.log(`[api] listening on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error(`[api] failed to start: ${error.message}`)
    process.exit(1)
  }
}

start()
