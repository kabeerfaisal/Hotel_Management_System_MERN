import { Router } from 'express'

import { createFeedback, getFeedback } from '../controllers/feedbackController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getFeedback)
router.post('/', createFeedback)

export default router
