import 'dotenv/config'

import cors from 'cors'
import express from 'express'

import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import roomRoutes from './routes/roomRoutes.js'
import userRoutes from './routes/userRoutes.js'
import serviceRequestRoutes from './routes/serviceRequestRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import settingRoutes from './routes/settingRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '16kb' }))

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'LuxuryStay Hospitality API',
    status: 'running',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)
app.use('/api/service-requests', serviceRequestRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/settings', settingRoutes)

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
