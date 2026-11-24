import { Router } from 'express'

import {
  createUser,
  getUsers,
  toggleUserStatus,
  updateUser,
} from '../controllers/userController.js'
import { authorize, protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect, authorize('admin'))

router.get('/', getUsers)
router.post('/', createUser)
router.put('/:id', updateUser)
router.patch('/:id/status', toggleUserStatus)

export default router
