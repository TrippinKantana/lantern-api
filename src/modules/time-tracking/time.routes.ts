import { Router } from 'express'
import { timeController } from './time.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('time_entries'))

router.get('/', rbac('time_entries', 'read'), (req, res, next) => { timeController.list(req, res).catch(next) })
router.get('/week-summary', rbac('time_entries', 'read'), (req, res, next) => { timeController.weekSummary(req, res).catch(next) })
router.post('/', rbac('time_entries', 'create'), (req, res, next) => { timeController.create(req, res).catch(next) })
router.patch('/:id', rbac('time_entries', 'update'), (req, res, next) => { timeController.update(req, res).catch(next) })
router.post('/:id/stop', rbac('time_entries', 'update'), (req, res, next) => { timeController.stop(req, res).catch(next) })
router.delete('/:id', rbac('time_entries', 'update'), (req, res, next) => { timeController.delete(req, res).catch(next) })

export { router as timeRoutes }
