import { Router } from 'express'
import { reportingController } from './reporting.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'

const router = Router()
router.use(auth())

router.get('/dashboard', rbac('reports', 'read'), (req, res, next) => { reportingController.dashboard(req, res).catch(next) })
router.get('/revenue', rbac('reports', 'read'), (req, res, next) => { reportingController.revenue(req, res).catch(next) })
router.get('/expenses', rbac('reports', 'read'), (req, res, next) => { reportingController.expenses(req, res).catch(next) })
router.get('/projects', rbac('reports', 'read'), (req, res, next) => { reportingController.projectStats(req, res).catch(next) })
router.get('/tickets', rbac('reports', 'read'), (req, res, next) => { reportingController.ticketStats(req, res).catch(next) })
router.get('/time', rbac('reports', 'read'), (req, res, next) => { reportingController.timeReport(req, res).catch(next) })
router.get('/crm', rbac('reports', 'read'), (req, res, next) => { reportingController.crmReport(req, res).catch(next) })

export { router as reportingRoutes }
