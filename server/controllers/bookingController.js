import mongoose from 'mongoose'

import Booking, { BOOKING_STATUSES } from '../models/Booking.js'
import Room from '../models/Room.js'
import ServiceRequest from '../models/ServiceRequest.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const STAFF_ROLES = ['admin', 'manager', 'receptionist']
const DEFAULT_TAX_RATE = 0.1

// Statuses that hold a room's dates and should be shown as unavailable.
const BLOCKING_STATUSES = ['pending', 'confirmed', 'checked-in']

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

export async function createBooking(req, res) {
  try {
    const {
      room: roomId,
      checkInDate: rawCheckIn,
      checkOutDate: rawCheckOut,
      numberOfGuests: rawNumberOfGuests,
      contactPhone: rawContactPhone,
      specialRequests: rawSpecialRequests,
    } = req.body ?? {}

    if (!roomId) throw new BookingError(400, 'A room is required')
    if (!mongoose.isValidObjectId(roomId)) {
      throw new BookingError(400, 'Invalid room id')
    }

    const numberOfGuests = Number(rawNumberOfGuests)
    if (!Number.isInteger(numberOfGuests) || numberOfGuests < 1) {
      throw new BookingError(400, 'Number of guests must be at least 1')
    }

    const contactPhone = String(rawContactPhone ?? '').trim()
    if (!contactPhone) throw new BookingError(400, 'Contact phone is required')

    const specialRequests = String(rawSpecialRequests ?? '').trim()

    const checkInDate = parseDate(rawCheckIn, 'Check-in date')
    const checkOutDate = parseDate(rawCheckOut, 'Check-out date')
    const nights = countNights(checkInDate, checkOutDate)

    const booking = await withRoomLock(String(roomId), async () => {
      const room = await Room.findById(roomId)

      if (!room) throw new BookingError(404, 'Room not found')

      const capacity = room.capacity ?? 2

      if (numberOfGuests > capacity) {
        throw new BookingError(
          400,
          `This room accommodates up to ${capacity} ${capacity === 1 ? 'guest' : 'guests'}`,
        )
      }

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
        numberOfGuests,
        contactPhone,
        specialRequests,
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

export async function getMyBookings(req, res) {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to load your bookings')
  }
}

// Public: only the blocked date ranges, never guest details.
export async function getRoomBookedDates(req, res) {
  try {
    const { roomId } = req.params

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room id' })
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const bookedDates = await Booking.find({
      room: roomId,
      status: { $in: BLOCKING_STATUSES },
      checkOutDate: { $gte: today },
    })
      .select('checkInDate checkOutDate status -_id')
      .sort({ checkInDate: 1 })
      .lean()

    return res.status(200).json({
      success: true,
      count: bookedDates.length,
      bookedDates,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to load booked dates')
  }
}

export async function getBookingInvoice(req, res) {
  try {
    const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    const guestId = String(booking.user?._id ?? booking.user)
    const isOwner = guestId === String(req.user.id)

    if (!STAFF_ROLES.includes(req.user.role) && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own invoices',
      })
    }

    const roomId = booking.room?._id ?? booking.room
    const services = await ServiceRequest.find({
      room: roomId,
      requestedBy: guestId,
      charge: { $gt: 0 },
    })
      .select('category description charge')
      .sort({ createdAt: 1 })

    const roundMoney = (value) => Math.round(value * 100) / 100
    const roomCharges = roundMoney(booking.totalPrice ?? 0)
    const serviceItems = services.map((service) => ({
      id: service._id,
      category: service.category,
      description: service.description,
      charge: roundMoney(service.charge),
    }))
    const servicesTotal = roundMoney(
      serviceItems.reduce((total, service) => total + service.charge, 0),
    )

    const Setting = mongoose.models.Setting
    const setting = Setting ? await Setting.findOne().select('taxRate').lean() : null
    const taxRate =
      setting && Number.isFinite(Number(setting.taxRate))
        ? Number(setting.taxRate) / 100
        : DEFAULT_TAX_RATE

    const subtotal = roundMoney(roomCharges + servicesTotal)
    const tax = roundMoney(subtotal * taxRate)

    return res.status(200).json({
      success: true,
      invoice: {
        invoiceNumber: `INV-${String(booking._id).slice(-6).toUpperCase()}`,
        issuedAt: new Date().toISOString(),
        booking: {
          id: booking._id,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          nights: countNights(booking.checkInDate, booking.checkOutDate),
          status: booking.status,
          numberOfGuests: booking.numberOfGuests ?? 1,
          contactPhone: booking.contactPhone ?? '',
          specialRequests: booking.specialRequests ?? '',
        },
        guest: {
          name: booking.user?.name ?? '—',
          email: booking.user?.email ?? '',
        },
        room: {
          roomNumber: booking.room?.roomNumber ?? '—',
          type: booking.room?.type ?? '—',
          pricePerNight: booking.room?.pricePerNight ?? 0,
        },
        roomCharges,
        services: serviceItems,
        servicesTotal,
        subtotal,
        taxRate,
        tax,
        grandTotal: roundMoney(subtotal + tax),
      },
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to generate invoice')
  }
}

export async function updateBookingStatus(req, res) {
  try {
    const { status } = req.body ?? {}

    if (!BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${BOOKING_STATUSES.join(', ')}`,
      })
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).populate(BOOKING_POPULATE)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    const roomId = booking.room?._id ?? booking.room

    if (status === 'checked-in') {
      await Room.findByIdAndUpdate(roomId, { status: 'occupied' })
    } else if (status === 'checked-out') {
      await Room.findByIdAndUpdate(roomId, { status: 'cleaning' })
    }

    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to update booking status')
  }
}

// A guest may cancel their own reservation; staff may cancel any booking.
export async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    const isOwner = String(booking.user) === String(req.user.id)

    if (!STAFF_ROLES.includes(req.user.role) && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own reservations',
      })
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Reservations that are ${booking.status} cannot be cancelled`,
      })
    }

    booking.status = 'cancelled'
    await booking.save()

    await Room.updateOne(
      { _id: booking.room, status: 'reserved' },
      { $set: { status: 'available' } },
    )

    await booking.populate(BOOKING_POPULATE)

    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      booking,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to cancel this reservation')
  }
}
