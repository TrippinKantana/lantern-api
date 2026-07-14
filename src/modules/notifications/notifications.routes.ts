import { Router } from 'express'
import { notificationsController } from './notifications.controller.js'
import { auth } from '../../middleware/auth.js'

const router = Router()
router.use(auth())

router.get('/', (req, res, next) => { notificationsController.list(req, res).catch(next) })
router.patch('/:id/read', (req, res, next) => { notificationsController.markRead(req, res).catch(next) })
router.post('/read-all', (req, res, next) => { notificationsController.markAllRead(req, res).catch(next) })

export { router as notificationRoutes }
