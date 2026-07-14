import { Router } from 'express'
import { authController } from './auth.controller.js'
import { auth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { loginSchema, acceptInviteSchema } from './auth.schema.js'

const router = Router()

router.post('/login', validate(loginSchema), (req, res, next) => { authController.login(req, res).catch(next) })
router.post('/refresh', (req, res, next) => { authController.refresh(req, res).catch(next) })
router.post('/logout', (req, res, next) => { authController.logout(req, res).catch(next) })
router.get('/me', auth(), (req, res, next) => { authController.me(req, res).catch(next) })
router.post('/accept-invite', validate(acceptInviteSchema), (req, res, next) => { authController.acceptInvite(req, res).catch(next) })

export { router as authRoutes }
