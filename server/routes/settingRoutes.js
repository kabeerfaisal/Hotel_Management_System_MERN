import { Router } from 'express'

import { getSettings, updateSettings } from '../controllers/settingController.js'
import { authorize, protect } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', protect, getSettings)
router.put('/', protect, authorize('admin'), updateSettings)

export default router
