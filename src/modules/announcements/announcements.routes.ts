import { Router } from 'express'
import { announcementsController } from './announcements.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'

const router = Router()
router.use(auth())

router.get('/', rbac('announcements', 'read'), (req, res, next) => { announcementsController.list(req, res).catch(next) })
router.post('/', rbac('announcements', 'create'), (req, res, next) => { announcementsController.create(req, res).catch(next) })
router.get('/:id', rbac('announcements', 'read'), (req, res, next) => { announcementsController.getById(req, res).catch(next) })
router.patch('/:id', rbac('announcements', 'create'), (req, res, next) => { announcementsController.update(req, res).catch(next) })
router.delete('/:id', rbac('announcements', 'create'), (req, res, next) => { announcementsController.delete(req, res).catch(next) })

export { router as announcementRoutes }
