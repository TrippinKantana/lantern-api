import { Router } from 'express'
import { auditLogsController } from './audit-logs.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'

const router = Router()
router.use(auth())

router.get('/', rbac('audit_logs', 'read'), (req, res, next) => { auditLogsController.list(req, res).catch(next) })

export { router as auditLogRoutes }
