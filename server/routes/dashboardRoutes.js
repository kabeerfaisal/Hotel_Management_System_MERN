import { Router } from 'express'

import { getDashboardStats } from '../controllers/dashboardController.js'
import { authorize, protect } from '../middleware/authMiddleware.js'

const router = Router()

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

router.get('/', protect, authorize(...STAFF_ROLES), getDashboardStats)

export default router
