import { Router } from 'express'
import { crmController } from './crm.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('leads'))

router.get('/leads', rbac('leads', 'read'), (req, res, next) => { crmController.listLeads(req, res).catch(next) })
router.get('/pipeline', rbac('leads', 'read'), (req, res, next) => { crmController.getPipeline(req, res).catch(next) })
router.post('/leads', rbac('leads', 'create'), (req, res, next) => { crmController.createLead(req, res).catch(next) })
router.get('/leads/:id', rbac('leads', 'read'), (req, res, next) => { crmController.getLeadById(req, res).catch(next) })
router.patch('/leads/:id', rbac('leads', 'update'), (req, res, next) => { crmController.updateLead(req, res).catch(next) })
router.delete('/leads/:id', rbac('leads', 'delete'), (req, res, next) => { crmController.deleteLead(req, res).catch(next) })
router.post('/leads/:id/activities', rbac('leads', 'update'), (req, res, next) => { crmController.addActivity(req, res).catch(next) })
router.post('/leads/:id/convert', rbac('leads', 'update'), (req, res, next) => { crmController.convertToCompany(req, res).catch(next) })

export { router as crmRoutes }
