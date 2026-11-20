import { Router } from 'express'

import {
  createBooking,
  getAllBookings,
  updateBookingStatus,
} from '../controllers/bookingController.js'
import { authorize, protect } from '../middleware/authMiddleware.js'

const router = Router()

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

// Any authenticated user can create a booking.
router.post('/', protect, createBooking)

// Staff manage the reservation book.
router.get('/', protect, authorize(...STAFF_ROLES), getAllBookings)
router.put('/:id/status', protect, authorize(...STAFF_ROLES), updateBookingStatus)

export default router
