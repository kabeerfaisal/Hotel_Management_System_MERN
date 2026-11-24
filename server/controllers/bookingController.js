import mongoose from 'mongoose'

import Booking, { BOOKING_STATUSES } from '../models/Booking.js'
import Room from '../models/Room.js'
import ServiceRequest from '../models/ServiceRequest.js'
import Setting from '../models/Setting.js'
import {
  emailRow,
  emailShell,
  emailTable,
  referenceBlock,
} from '../utils/emailTemplates.js'
import { formatLabel, formatPKR, formatStayDate, roundMoney } from '../utils/format.js'
import { escapeHtml, sendEmail } from '../utils/sendEmail.js'

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

function buildBookingEmail({
  reference,
  guestName,
  roomNumber,
  roomType,
  checkInDate,
  checkOutDate,
  nights,
  numberOfGuests,
  roomCharges,
  taxRate,
  tax,
  grandTotal,
}) {
  const row = (label, value) => `
    <tr>
      <td style="padding:9px 0;font-size:13px;color:#6b645a;">${label}</td>
      <td style="padding:9px 0;font-size:13px;color:#171a21;text-align:right;font-weight:bold;">${value}</td>
    </tr>
  `

  return `
    <div style="margin:0;padding:32px 16px;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;color:#2c2925;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e6dfd2;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:#171a21;color:#f7f3e8;">
            <div style="font-size:20px;letter-spacing:2px;font-weight:bold;">LUXURYSTAY</div>
            <div style="margin-top:6px;font-size:11px;letter-spacing:3px;color:#d8b45a;">HOSPITALITY</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:23px;color:#171a21;">Reservation confirmed</h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b463f;">
              Dear ${escapeHtml(guestName)}, thank you for choosing LuxuryStay. Your stay details and invoice are below.
            </p>

            <div style="margin-bottom:22px;padding:14px 16px;background:#faf6ec;border:1px solid #eadfc4;border-radius:12px;">
              <div style="font-size:11px;letter-spacing:2px;color:#8a8175;text-transform:uppercase;">Booking reference</div>
              <div style="margin-top:4px;font-size:18px;font-weight:bold;color:#171a21;">${escapeHtml(reference)}</div>
            </div>

            <h2 style="margin:0 0 8px;font-size:15px;color:#171a21;">Stay details</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${row('Guest', escapeHtml(guestName))}
              ${row('Suite', `${escapeHtml(roomType)} · Room ${escapeHtml(roomNumber)}`)}
              ${row('Check-in', formatStayDate(checkInDate))}
              ${row('Check-out', formatStayDate(checkOutDate))}
              ${row('Nights', nights)}
              ${row('Guests', numberOfGuests)}
            </table>

            <h2 style="margin:24px 0 8px;font-size:15px;color:#171a21;">Invoice summary</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6dfd2;">
              ${row('Room charges', formatPKR(roomCharges))}
              ${row(`Tax (${Math.round(taxRate * 100)}%)`, formatPKR(tax))}
              <tr>
                <td style="padding:14px 0 0;font-size:15px;color:#171a21;font-weight:bold;border-top:1px solid #e6dfd2;">Grand total</td>
                <td style="padding:14px 0 0;font-size:17px;color:#171a21;text-align:right;font-weight:bold;border-top:1px solid #e6dfd2;">${formatPKR(grandTotal)}</td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b645a;">
              Our concierge team is available 24/7. Reply to this email or call +92 3322334100 if you need anything before arrival.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px;background:#f6f3ec;font-size:11px;color:#8a8175;">
            LuxuryStay Hospitality · Clifton, Karachi · This email also serves as your PKR invoice.
          </td>
        </tr>
      </table>
    </div>
  `
}

async function getTaxRate() {
  const setting = await Setting.findOne().select('taxRate').lean()

  return setting && Number.isFinite(Number(setting.taxRate))
    ? Number(setting.taxRate) / 100
    : DEFAULT_TAX_RATE
}

function bookingReference(id) {
  return `LS-${String(id).slice(-6).toUpperCase()}`
}

function roomSummary(booking) {
  return {
    roomType: formatLabel(booking.room?.type ?? 'Suite'),
    roomNumber: booking.room?.roomNumber ?? '—',
  }
}

async function sendBookingMail(booking, mail, label) {
  const to = booking.user?.email

  if (!to) return false

  try {
    await sendEmail({ to, ...mail })
    return true
  } catch (error) {
    console.error(`[bookings] ${label} email failed:`, error.message)
    return false
  }
}

async function assertRoomAvailable({
  roomId,
  checkInDate,
  checkOutDate,
  excludeId,
}) {
  const conflict = await Booking.findOne({
    _id: { $ne: excludeId },
    room: roomId,
    status: { $in: BLOCKING_STATUSES },
    checkInDate: { $lt: checkOutDate },
    checkOutDate: { $gt: checkInDate },
  }).select('_id')

  if (conflict) {
    throw new BookingError(
      400,
      'This room is already booked for the selected dates',
    )
  }
}

function stayDetailRows({ checkInDate, checkOutDate, nights, numberOfGuests }) {
  return [
    emailRow('Check-in', formatStayDate(checkInDate)),
    emailRow('Check-out', formatStayDate(checkOutDate)),
    emailRow('Nights', nights),
    emailRow('Guests', numberOfGuests),
  ]
}

function buildDateUpdateEmail({
  reference,
  guestName,
  roomType,
  roomNumber,
  previousCheckIn,
  previousCheckOut,
  checkInDate,
  checkOutDate,
  nights,
  totalPrice,
}) {
  return emailShell({
    heading: 'Your stay dates were updated',
    intro: `Dear ${escapeHtml(guestName)}, your LuxuryStay reservation dates have been updated. Here are the new details.`,
    content: `
      ${referenceBlock(reference)}
      <h2 style="margin:0 0 8px;font-size:15px;color:#171a21;">Updated stay</h2>
      ${emailTable([
        emailRow(
          'Suite',
          `${escapeHtml(roomType)} · Room ${escapeHtml(roomNumber)}`,
        ),
        emailRow(
          'Previous dates',
          `${formatStayDate(previousCheckIn)} → ${formatStayDate(previousCheckOut)}`,
        ),
        emailRow('New check-in', formatStayDate(checkInDate)),
        emailRow('New check-out', formatStayDate(checkOutDate)),
        emailRow('Nights', nights),
        emailRow('Updated total', formatPKR(totalPrice)),
      ])}
    `,
  })
}

function buildStayApprovedEmail({
  reference,
  guestName,
  roomType,
  roomNumber,
  checkInDate,
  checkOutDate,
  nights,
  totalPrice,
}) {
  return emailShell({
    heading: 'Stay change approved',
    intro: `Dear ${escapeHtml(guestName)}, we have approved your stay change request. Your reservation has been updated as follows.`,
    content: `
      ${referenceBlock(reference)}
      <h2 style="margin:0 0 8px;font-size:15px;color:#171a21;">Approved stay</h2>
      ${emailTable([
        emailRow(
          'Suite',
          `${escapeHtml(roomType)} · Room ${escapeHtml(roomNumber)}`,
        ),
        emailRow('Check-in', formatStayDate(checkInDate)),
        emailRow('Check-out', formatStayDate(checkOutDate)),
        emailRow('Nights', nights),
        emailRow('Updated total', formatPKR(totalPrice)),
      ])}
    `,
  })
}

function buildStayRejectedEmail({
  reference,
  guestName,
  roomType,
  roomNumber,
  requestedCheckOutDate,
  checkInDate,
  checkOutDate,
}) {
  return emailShell({
    heading: 'Stay change request not approved',
    intro: `Dear ${escapeHtml(guestName)}, we reviewed your request to adjust your stay. Unfortunately we cannot approve the requested dates.`,
    content: `
      ${referenceBlock(reference)}
      <h2 style="margin:0 0 8px;font-size:15px;color:#171a21;">Request details</h2>
      ${emailTable([
        emailRow(
          'Suite',
          `${escapeHtml(roomType)} · Room ${escapeHtml(roomNumber)}`,
        ),
        emailRow('Requested check-out', formatStayDate(requestedCheckOutDate)),
        emailRow('Current check-in', formatStayDate(checkInDate)),
        emailRow('Current check-out', formatStayDate(checkOutDate)),
      ])}
      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b645a;">
        Your original reservation remains unchanged. Please contact the front desk if you would like to discuss alternative dates.
      </p>
    `,
  })
}

function buildCheckInEmail({
  reference,
  guestName,
  roomType,
  roomNumber,
  checkInDate,
  checkOutDate,
  nights,
  numberOfGuests,
}) {
  return emailShell({
    heading: 'Welcome to LuxuryStay',
    intro: `Dear ${escapeHtml(guestName)}, your suite is ready. We are delighted to welcome you and wish you a wonderful stay.`,
    content: `
      ${referenceBlock(reference)}
      <h2 style="margin:0 0 8px;font-size:15px;color:#171a21;">Your stay</h2>
      ${emailTable([
        emailRow(
          'Suite',
          `${escapeHtml(roomType)} · Room ${escapeHtml(roomNumber)}`,
        ),
        ...stayDetailRows({
          checkInDate,
          checkOutDate,
          nights,
          numberOfGuests,
        }),
      ])}
      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b645a;">
        Our concierge desk is available around the clock for dining, transport, or any special request during your visit.
      </p>
    `,
  })
}

function buildCheckOutEmail({
  reference,
  guestName,
  roomType,
  roomNumber,
  checkInDate,
  checkOutDate,
  nights,
  numberOfGuests,
  invoice,
}) {
  const serviceRows = invoice.services.map((service) =>
    emailRow(
      escapeHtml(formatLabel(service.category)),
      formatPKR(service.charge),
    ),
  )

  return emailShell({
    heading: 'Thank you for staying with us',
    intro: `Dear ${escapeHtml(guestName)}, thank you for choosing LuxuryStay. Your stay is complete, and your final PKR invoice summary is below.`,
    content: `
      ${referenceBlock(reference)}
      <h2 style="margin:0 0 8px;font-size:15px;color:#171a21;">Stay summary</h2>
      ${emailTable([
        emailRow(
          'Suite',
          `${escapeHtml(roomType)} · Room ${escapeHtml(roomNumber)}`,
        ),
        ...stayDetailRows({
          checkInDate,
          checkOutDate,
          nights,
          numberOfGuests,
        }),
      ])}

      <h2 style="margin:24px 0 8px;font-size:15px;color:#171a21;">Final invoice</h2>
      ${emailTable([
        emailRow('Room charges', formatPKR(invoice.roomCharges)),
        ...serviceRows,
        ...(invoice.servicesTotal > 0
          ? [emailRow('Services total', formatPKR(invoice.servicesTotal))]
          : []),
        emailRow(
          `Tax (${Math.round(invoice.taxRate * 100)}%)`,
          formatPKR(invoice.tax),
        ),
        emailRow(
          'Grand total',
          `<span style="font-size:16px;">${formatPKR(invoice.grandTotal)}</span>`,
        ),
      ])}
      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b645a;">
        We hope to welcome you back soon. This email also serves as your final PKR invoice.
      </p>
    `,
  })
}

function buildCancellationEmail({
  reference,
  guestName,
  roomType,
  roomNumber,
  checkInDate,
  checkOutDate,
  totalPrice,
}) {
  return emailShell({
    heading: 'Reservation cancelled',
    intro: `Dear ${escapeHtml(guestName)}, your LuxuryStay reservation has been cancelled and the room dates have been released.`,
    content: `
      ${referenceBlock(reference)}
      <h2 style="margin:0 0 8px;font-size:15px;color:#171a21;">Cancelled reservation</h2>
      ${emailTable([
        emailRow(
          'Suite',
          `${escapeHtml(roomType)} · Room ${escapeHtml(roomNumber)}`,
        ),
        emailRow('Check-in', formatStayDate(checkInDate)),
        emailRow('Check-out', formatStayDate(checkOutDate)),
        emailRow('Reservation total', formatPKR(totalPrice)),
      ])}
      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b645a;">
        If this cancellation was not expected, please contact our team immediately so we can assist you.
      </p>
    `,
  })
}

async function buildInvoiceSummary(booking) {
  const roomId = booking.room?._id ?? booking.room
  const guestId = booking.user?._id ?? booking.user

  const services = await ServiceRequest.find({
    room: roomId,
    requestedBy: guestId,
    charge: { $gt: 0 },
  })
    .select('category description charge')
    .sort({ createdAt: 1 })
    .lean()

  const items = services.map((service) => ({
    category: service.category,
    description: service.description,
    charge: roundMoney(service.charge),
  }))

  const roomCharges = roundMoney(booking.totalPrice ?? 0)
  const servicesTotal = roundMoney(
    items.reduce((total, service) => total + service.charge, 0),
  )
  const subtotal = roundMoney(roomCharges + servicesTotal)
  const taxRate = await getTaxRate()
  const tax = roundMoney(subtotal * taxRate)

  return {
    roomCharges,
    services: items,
    servicesTotal,
    taxRate,
    tax,
    grandTotal: roundMoney(subtotal + tax),
  }
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

    let emailSent = false

    try {
      const guestEmail = booking.user?.email

      if (guestEmail) {
        const setting = await Setting.findOne().select('taxRate').lean()
        const taxRate =
          setting && Number.isFinite(Number(setting.taxRate))
            ? Number(setting.taxRate) / 100
            : DEFAULT_TAX_RATE

        const roomCharges = Math.round((booking.totalPrice ?? 0) * 100) / 100
        const tax = Math.round(roomCharges * taxRate * 100) / 100
        const grandTotal = Math.round((roomCharges + tax) * 100) / 100
        const reference = `LS-${String(booking._id).slice(-6).toUpperCase()}`
        const roomType = booking.room?.type ?? 'Suite'
        const roomNumber = booking.room?.roomNumber ?? '—'

        await sendEmail({
          to: guestEmail,
          subject: `Reservation ${reference} confirmed — LuxuryStay`,
          html: buildBookingEmail({
            reference,
            guestName: booking.user?.name ?? 'Guest',
            roomNumber,
            roomType: roomType.charAt(0).toUpperCase() + roomType.slice(1),
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            nights,
            numberOfGuests,
            roomCharges,
            taxRate,
            tax,
            grandTotal,
          }),
          text: `Your LuxuryStay reservation ${reference} is confirmed. Room ${roomNumber}, ${formatStayDate(booking.checkInDate)} to ${formatStayDate(booking.checkOutDate)}. Room charges: ${formatPKR(roomCharges)}. Tax: ${formatPKR(tax)}. Grand total: ${formatPKR(grandTotal)}.`,
        })

        emailSent = true
      }
    } catch (error) {
      console.error('[bookings] confirmation email failed:', error.message)
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      emailSent,
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

    const setting = await Setting.findOne().select('taxRate').lean()
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

export async function updateBookingDates(req, res) {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      BOOKING_POPULATE,
    )

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    const guestId = String(booking.user?._id ?? booking.user)
    const isOwner = guestId === String(req.user.id)

    if (!STAFF_ROLES.includes(req.user.role) && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own reservations',
      })
    }

    if (!['pending', 'confirmed', 'checked-in'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Reservations that are ${booking.status} cannot be modified`,
      })
    }

    const body = req.body ?? {}
    const roomId = String(booking.room?._id ?? booking.room)
    const { roomType, roomNumber } = roomSummary(booking)
    const reference = bookingReference(booking._id)

    // In-house guests request a later check-out; reception reviews it.
    if (booking.status === 'checked-in') {
      if (booking.stayChangeRequest?.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'A stay change request is already pending review',
        })
      }

      const requestedCheckOutDate = parseDate(
        body.requestedCheckOutDate ?? body.checkOutDate,
        'Requested check-out date',
      )
      const requestedCheckInDate = body.requestedCheckInDate
        ? parseDate(body.requestedCheckInDate, 'Requested check-in date')
        : null
      const effectiveCheckIn = requestedCheckInDate ?? new Date(booking.checkInDate)

      countNights(effectiveCheckIn, requestedCheckOutDate)

      await withRoomLock(roomId, () =>
        assertRoomAvailable({
          roomId,
          checkInDate: effectiveCheckIn,
          checkOutDate: requestedCheckOutDate,
          excludeId: booking._id,
        }),
      )

      booking.stayChangeRequest = {
        requestedCheckInDate: requestedCheckInDate ?? undefined,
        requestedCheckOutDate,
        note: String(body.note ?? '').trim().slice(0, 500),
        status: 'pending',
        requestedAt: new Date(),
      }

      await booking.save()

      return res.status(200).json({
        success: true,
        message: 'Stay change request submitted for review',
        booking,
      })
    }

    if (!body.checkInDate && !body.checkOutDate) {
      throw new BookingError(
        400,
        'Provide a new check-in or check-out date',
      )
    }

    const previousCheckIn = new Date(booking.checkInDate)
    const previousCheckOut = new Date(booking.checkOutDate)
    const newCheckIn = body.checkInDate
      ? parseDate(body.checkInDate, 'Check-in date')
      : previousCheckIn
    const newCheckOut = body.checkOutDate
      ? parseDate(body.checkOutDate, 'Check-out date')
      : previousCheckOut
    const nights = countNights(newCheckIn, newCheckOut)

    let newTotalPrice = 0

    await withRoomLock(roomId, async () => {
      const room = await Room.findById(roomId).select('pricePerNight')

      if (!room) throw new BookingError(404, 'Room not found')

      await assertRoomAvailable({
        roomId,
        checkInDate: newCheckIn,
        checkOutDate: newCheckOut,
        excludeId: booking._id,
      })

      newTotalPrice = roundMoney(nights * room.pricePerNight)

      booking.checkInDate = newCheckIn
      booking.checkOutDate = newCheckOut
      booking.totalPrice = newTotalPrice

      await booking.save()
    })

    await sendBookingMail(
      booking,
      {
        subject: `Reservation ${reference} dates updated — LuxuryStay`,
        html: buildDateUpdateEmail({
          reference,
          guestName: booking.user?.name ?? 'Guest',
          roomType,
          roomNumber,
          previousCheckIn,
          previousCheckOut,
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
          nights,
          totalPrice: newTotalPrice,
        }),
        text: `Your LuxuryStay reservation ${reference} dates have been updated. Room ${roomNumber}, ${formatStayDate(newCheckIn)} to ${formatStayDate(newCheckOut)}. ${nights} night(s). Updated total: ${formatPKR(newTotalPrice)}.`,
      },
      'date update',
    )

    return res.status(200).json({
      success: true,
      message: 'Reservation dates updated successfully',
      booking,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to update reservation dates')
  }
}

export async function reviewStayChangeRequest(req, res) {
  try {
    const { action } = req.body ?? {}

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'approve' or 'reject'",
      })
    }

    const booking = await Booking.findById(req.params.id).populate(
      BOOKING_POPULATE,
    )

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    if (booking.status !== 'checked-in') {
      return res.status(400).json({
        success: false,
        message: 'Stay change requests can only be reviewed for checked-in guests',
      })
    }

    const request = booking.stayChangeRequest

    if (!request || request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'There is no pending stay change request for this booking',
      })
    }

    const reference = bookingReference(booking._id)
    const { roomType, roomNumber } = roomSummary(booking)

    if (action === 'reject') {
      request.status = 'rejected'
      await booking.save()

      await sendBookingMail(
        booking,
        {
          subject: `Stay change request update — ${reference}`,
          html: buildStayRejectedEmail({
            reference,
            guestName: booking.user?.name ?? 'Guest',
            roomType,
            roomNumber,
            requestedCheckOutDate: request.requestedCheckOutDate,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
          }),
          text: `We could not approve your requested check-out of ${formatStayDate(request.requestedCheckOutDate)} for reservation ${reference}. Your current check-out remains ${formatStayDate(booking.checkOutDate)}.`,
        },
        'stay change rejection',
      )

      return res.status(200).json({
        success: true,
        message: 'Stay change request rejected',
        booking,
      })
    }

    const newCheckIn = request.requestedCheckInDate
      ? new Date(request.requestedCheckInDate)
      : new Date(booking.checkInDate)
    const newCheckOut = new Date(request.requestedCheckOutDate)
    const roomId = String(booking.room?._id ?? booking.room)
    const nights = countNights(newCheckIn, newCheckOut)

    let newTotalPrice = 0

    await withRoomLock(roomId, async () => {
      const room = await Room.findById(roomId).select('pricePerNight')

      if (!room) throw new BookingError(404, 'Room not found')

      await assertRoomAvailable({
        roomId,
        checkInDate: newCheckIn,
        checkOutDate: newCheckOut,
        excludeId: booking._id,
      })

      newTotalPrice = roundMoney(nights * room.pricePerNight)

      booking.checkInDate = newCheckIn
      booking.checkOutDate = newCheckOut
      booking.totalPrice = newTotalPrice
      request.status = 'approved'

      await booking.save()
    })

    await sendBookingMail(
      booking,
      {
        subject: `Stay change approved — ${reference}`,
        html: buildStayApprovedEmail({
          reference,
          guestName: booking.user?.name ?? 'Guest',
          roomType,
          roomNumber,
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
          nights,
          totalPrice: newTotalPrice,
        }),
        text: `Your stay change for reservation ${reference} has been approved. New dates: ${formatStayDate(newCheckIn)} to ${formatStayDate(newCheckOut)} (${nights} night(s)). Updated total: ${formatPKR(newTotalPrice)}.`,
      },
      'stay change approval',
    )

    return res.status(200).json({
      success: true,
      message: 'Stay change request approved',
      booking,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to review stay change request')
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

    const booking = await Booking.findById(req.params.id).populate(
      BOOKING_POPULATE,
    )

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    if (booking.status !== status) {
      booking.status = status
      await booking.save()

      const roomId = booking.room?._id ?? booking.room

      if (status === 'checked-in') {
        await Room.findByIdAndUpdate(roomId, { status: 'occupied' })
      } else if (status === 'checked-out') {
        await Room.findByIdAndUpdate(roomId, { status: 'cleaning' })
      }

      const reference = bookingReference(booking._id)
      const { roomType, roomNumber } = roomSummary(booking)

      if (status === 'checked-in') {
        try {
          const nights = countNights(booking.checkInDate, booking.checkOutDate)

          await sendBookingMail(
            booking,
            {
              subject: `Welcome to LuxuryStay — ${reference}`,
              html: buildCheckInEmail({
                reference,
                guestName: booking.user?.name ?? 'Guest',
                roomType,
                roomNumber,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                nights,
                numberOfGuests: booking.numberOfGuests ?? 1,
              }),
              text: `Welcome to LuxuryStay. Reservation ${reference}, room ${roomNumber}. Check-out is ${formatStayDate(booking.checkOutDate)}. Our concierge desk is available 24/7.`,
            },
            'check-in',
          )
        } catch (error) {
          console.error('[bookings] check-in email failed:', error.message)
        }
      } else if (status === 'checked-out') {
        try {
          const nights = countNights(booking.checkInDate, booking.checkOutDate)
          const invoice = await buildInvoiceSummary(booking)

          await sendBookingMail(
            booking,
            {
              subject: `Your final invoice — ${reference}`,
              html: buildCheckOutEmail({
                reference,
                guestName: booking.user?.name ?? 'Guest',
                roomType,
                roomNumber,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                nights,
                numberOfGuests: booking.numberOfGuests ?? 1,
                invoice,
              }),
              text: `Thank you for staying at LuxuryStay. Reservation ${reference}, room ${roomNumber}. Room charges: ${formatPKR(invoice.roomCharges)}. Tax: ${formatPKR(invoice.tax)}. Grand total: ${formatPKR(invoice.grandTotal)}.`,
            },
            'check-out',
          )
        } catch (error) {
          console.error('[bookings] check-out email failed:', error.message)
        }
      }
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

    const reference = bookingReference(booking._id)
    const { roomType, roomNumber } = roomSummary(booking)

    await sendBookingMail(
      booking,
      {
        subject: `Reservation ${reference} cancelled — LuxuryStay`,
        html: buildCancellationEmail({
          reference,
          guestName: booking.user?.name ?? 'Guest',
          roomType,
          roomNumber,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: booking.totalPrice,
        }),
        text: `Your LuxuryStay reservation ${reference} has been cancelled. Room ${roomNumber}, ${formatStayDate(booking.checkInDate)} to ${formatStayDate(booking.checkOutDate)}. The room dates have been released.`,
      },
      'cancellation',
    )

    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      booking,
    })
  } catch (error) {
    return sendBookingError(res, error, 'Unable to cancel this reservation')
  }
}
