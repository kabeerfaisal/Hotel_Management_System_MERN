import 'dotenv/config'

import cors from 'cors'
import express from 'express'

import { connectDB } from './config/db.js'

const app = express()
const PORT = process.env.PORT || 5000

// ── Middleware ───────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// Lightweight service check (no business routes yet)
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'LuxuryStay Hospitality API',
    status: 'running',
  })
})

// ── Bootstrap ────────────────────────────────────────────────
async function start() {
  try {
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
