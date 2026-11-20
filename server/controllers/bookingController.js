import mongoose from 'mongoose'

import Booking, { BOOKING_STATUSES } from '../models/Booking.js'
import Room from '../models/Room.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const BOOKING_POPULATE = [
  { path: 'user', select: 'name email' },
  { path: 'room', select: 'roomNumber type pricePerNight' },
]

class BookingError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'BookingError'
    this.statusCode = statusCode
  }
}

/**
 * Serialize booking creation per room inside this process so two simultaneous
 * requests cannot both pass the overlap check. Deployments with multiple API
 * instances should add a database-level guard as well.
 */
const roomQueues = new Map()

function withRoomLock(roomId, task) {
  const previous = roomQueues.get(roomId) ?? Promise.resolve()
  const run = previous.then(task, task)
  const marker = run.then(
    () => {},
    () => {},
  )

  roomQueues.set(roomId, marker)

  return run.finally(() => {
    if (roomQueues.get(roomId) === marker) roomQueues.delete(roomId)
  })
}

function parseDate(value, label) {
  if (!value) throw new BookingError(400, `${label} is required`)

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new BookingError(400, `${label} must be a valid date`)
  }

  return date
}

/**
 * Count nights by calendar day so a 14:00 check-in and an 11:00 check-out
 * still count as a single night.
 */
function countNights(checkInDate, checkOutDate) {
  const start = Date.UTC(
    checkInDate.getUTCFullYear(),
    checkInDate.getUTCMonth(),
    checkInDate.getUTCDate(),
  )
  const end = Date.UTC(
    checkOutDate.getUTCFullYear(),
    checkOutDate.getUTCMonth(),
    checkOutDate.getUTCDate(),
  )
  const nights = Math.round((end - start) / MS_PER_DAY)

  if (nights < 1) {
    throw new BookingError(400, 'Check-out date must be after the check-in date')
  }

  return nights
}

function sendBookingError(res, error, fallbackMessage) {
  if (error instanceof BookingError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: Object.values(error.errors).map((fieldError) => ({
        field: fieldError.path,
        message: fieldError.message,
      })),
    })
  }

  if (error.name === 'CastError') {
    return res.status(404).json({ success: false, message: 'Booking not found' })
  }

  console.error('[bookings]', error)
  return res.status(500).json({ success: false, message: fallbackMessage })
}

/**
 * POST /api/bookings
 * Any authenticated user can book a room. The guest comes from the token,
 * the nightly rate from the room, and the default status is `pending`.
 */
export async function createBooking(req, res) {
  try {
    const {
      room: roomId,
      checkInDate: rawCheckIn,
      checkOutDate: rawCheckOut,
    } = req.body ?? {}

    if (!roomId) throw new BookingError(400, 'A room is required')
    if (!mongoose.isValidObjectId(roomId)) {
      throw new BookingError(400, 'Invalid room id')
    }

    const checkInDate = parseDate(rawCheckIn, 'Check-in date')
    const checkOutDate = parseDate(rawCheckOut, 'Check-out date')
    const nights = countNights(checkInDate, checkOutDate)

    const booking = await withRoomLock(String(roomId), async () => {
      const room = await Room.findById(roomId)

      if (!room) throw new BookingError(404, 'Room not found')

      const conflict = await Booking.findOne({
        room: room._id,
        status: { $ne: 'cancelled' },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate },
      }).select('_id')

      if (conflict) {
        throw new BookingError(
          400,
          'This room is already booked for the selected dates',
        )
      }

      const totalPrice = Math.round(nights * room.pricePerNight * 100) / 100

      const created = await Booking.create({
        user: req.user.id,
        room: room._id,
        checkInDate,
        checkOutDate,
        totalPrice,
        status: 'pending',
      })

      await created.populate(BOOKING_POPULATE)
      return created
    })

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to create booking')
  }
}

/**
 * GET /api/bookings
 * Staff only. Includes the guest and room summaries the dashboard needs.
 */
export async function getAllBookings(req, res) {
  try {
    const bookings = await Booking.find()
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to load bookings')
  }
}

/**
 * PUT /api/bookings/:id/status
 * Staff only. Moving a booking to `cancelled` releases its dates.
 */
export async function updateBookingStatus(req, res) {
  try {
    const { status } = req.body ?? {}

    if (!BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${BOOKING_STATUSES.join(', ')}`,
      })
    }

    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    booking.status = status
    await booking.save()
    await booking.populate(BOOKING_POPULATE)

    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to update booking status')
  }
}
