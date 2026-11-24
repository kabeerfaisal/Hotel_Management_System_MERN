import { Router } from 'express'

import {
  cancelBooking,
  createBooking,
  getAllBookings,
  getBookingInvoice,
  getMyBookings,
  getRoomBookedDates,
  reviewStayChangeRequest,
  updateBookingDates,
  updateBookingStatus,
} from '../controllers/bookingController.js'
import { authorize, protect } from '../middleware/authMiddleware.js'

const router = Router()

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

router.post('/', protect, createBooking)
router.get('/me', protect, getMyBookings)
router.get('/room/:roomId/booked-dates', getRoomBookedDates)
router.get('/:id/invoice', protect, getBookingInvoice)
router.patch('/:id/cancel', protect, cancelBooking)
router.patch('/:id/dates', protect, updateBookingDates)
router.patch(
  '/:id/stay-request',
  protect,
  authorize(...STAFF_ROLES),
  reviewStayChangeRequest,
)
router.get('/', protect, authorize(...STAFF_ROLES), getAllBookings)
router.put('/:id/status', protect, authorize(...STAFF_ROLES), updateBookingStatus)
router.patch('/:id/status', protect, authorize(...STAFF_ROLES), updateBookingStatus)

export default router
