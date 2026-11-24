import { Router } from 'express'

import {
  createServiceRequest,
  getServiceRequests,
  updateServiceRequest,
} from '../controllers/serviceRequestController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getServiceRequests)
router.post('/', createServiceRequest)
router.patch('/:id', updateServiceRequest)

export default router
