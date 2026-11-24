import { Router } from 'express'

import {
  createRoom,
  deleteRoom,
  getRoomById,
  getRooms,
  updateRoom,
} from '../controllers/roomController.js'
import { authorize, protect } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', getRooms)
router.get('/:id', protect, getRoomById)
router.post('/', protect, authorize('admin', 'manager'), createRoom)
router.put('/:id', protect, authorize('admin', 'manager'), updateRoom)
router.delete('/:id', protect, authorize('admin', 'manager'), deleteRoom)

export default router
