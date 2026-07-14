import { Router } from 'express'
import { ticketsController } from './tickets.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('tickets'))

router.get('/', rbac('tickets', 'read'), (req, res, next) => { ticketsController.list(req, res).catch(next) })
router.post('/', rbac('tickets', 'create'), (req, res, next) => { ticketsController.create(req, res).catch(next) })
router.get('/:id', rbac('tickets', 'read'), (req, res, next) => { ticketsController.getById(req, res).catch(next) })
router.patch('/:id', rbac('tickets', 'update'), (req, res, next) => { ticketsController.update(req, res).catch(next) })
router.post('/:id/comments', rbac('tickets', 'update'), (req, res, next) => { ticketsController.addComment(req, res).catch(next) })

export { router as ticketRoutes }
