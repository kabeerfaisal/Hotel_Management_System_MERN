import { Router } from 'express'

import healthRoutes from './health.routes.js'

const router = Router()

router.use('/health', healthRoutes)

// Feature routers are mounted here as modules land, e.g.:
// router.use('/auth', authRoutes)
// router.use('/rooms', roomRoutes)

export default router
