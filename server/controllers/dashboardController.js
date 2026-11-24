import Booking from '../models/Booking.js'
import Room from '../models/Room.js'
import ServiceRequest from '../models/ServiceRequest.js'

const RECENT_BOOKING_POPULATE = [
  { path: 'user', select: 'name' },
  { path: 'room', select: 'roomNumber' },
]

const SERVICE_ALERT_POPULATE = [
  { path: 'room', select: 'roomNumber' },
  { path: 'requestedBy', select: 'name' },
]

export async function getDashboardStats(req, res) {
  try {
    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      activeBookings,
      revenueRows,
      recentBookings,
      pendingBookings,
      serviceAlerts,
    ] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Room.countDocuments({ status: 'occupied' }),
      Booking.countDocuments({ status: { $in: ['confirmed', 'checked-in'] } }),
      Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
      ]),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate(RECENT_BOOKING_POPULATE),
      Booking.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate(RECENT_BOOKING_POPULATE),
      ServiceRequest.find({ $or: [{ status: 'pending' }, { priority: 'high' }] })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate(SERVICE_ALERT_POPULATE),
    ])

    const notifications = [
      ...pendingBookings.map((booking) => ({
        id: String(booking._id),
        type: 'booking',
        title: 'Pending booking',
        message: `${booking.user?.name ?? 'Guest'} · Room ${
          booking.room?.roomNumber ?? '—'
        }`,
        createdAt: booking.createdAt,
        to: '/bookings',
      })),
      ...serviceAlerts.map((request) => ({
        id: String(request._id),
        type: 'service',
        title: `${request.category.replace('-', ' ')} request`,
        message: `Room ${request.room?.roomNumber ?? '—'} · ${
          request.priority === 'high' ? 'High priority' : 'Pending'
        }${request.description ? ` · ${request.description.slice(0, 60)}` : ''}`,
        priority: request.priority,
        createdAt: request.createdAt,
        to: '/services',
      })),
    ].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))

    return res.status(200).json({
      success: true,
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate: Math.round((occupiedRooms / totalRooms) * 100) || 0,
      activeBookings,
      totalRevenue: revenueRows[0]?.totalRevenue ?? 0,
      recentBookings,
      notifications,
    })
  } catch (error) {
    console.error('[dashboard]', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to load dashboard stats',
    })
  }
}
