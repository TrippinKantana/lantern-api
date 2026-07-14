import { Router } from 'express'
import { calendarController } from './calendar.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'

const router = Router()
router.use(auth())

router.get('/events', rbac('calendar', 'read'), (req, res, next) => { calendarController.listEvents(req, res).catch(next) })
router.post('/events', rbac('calendar', 'create'), (req, res, next) => { calendarController.create(req, res).catch(next) })
router.get('/events/:id', rbac('calendar', 'read'), (req, res, next) => { calendarController.getById(req, res).catch(next) })
router.patch('/events/:id', rbac('calendar', 'create'), (req, res, next) => { calendarController.update(req, res).catch(next) })
router.delete('/events/:id', rbac('calendar', 'create'), (req, res, next) => { calendarController.delete(req, res).catch(next) })
router.post('/events/:id/rsvp', (req, res, next) => { calendarController.rsvp(req, res).catch(next) })

export { router as calendarRoutes }
