import { Router } from 'express'
import { messagingController } from './messaging.controller.js'
import { auth } from '../../middleware/auth.js'

const router = Router()
router.use(auth())

router.get('/channels', (req, res, next) => { messagingController.listChannels(req, res).catch(next) })
router.post('/channels', (req, res, next) => { messagingController.createChannel(req, res).catch(next) })
router.get('/channels/:id/messages', (req, res, next) => { messagingController.getMessages(req, res).catch(next) })
router.post('/channels/:id/messages', (req, res, next) => { messagingController.sendMessage(req, res).catch(next) })

export { router as messagingRoutes }
