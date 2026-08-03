import { Router } from 'express'
import { invoicesController } from './invoices.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('invoices'))

router.get('/', rbac('invoices', 'read'), (req, res, next) => { invoicesController.list(req, res).catch(next) })
router.post('/', rbac('invoices', 'create'), (req, res, next) => { invoicesController.create(req, res).catch(next) })
router.get('/:id', rbac('invoices', 'read'), (req, res, next) => { invoicesController.getById(req, res).catch(next) })
router.patch('/:id', rbac('invoices', 'update'), (req, res, next) => { invoicesController.update(req, res).catch(next) })
router.delete('/:id', rbac('invoices', 'delete'), (req, res, next) => { invoicesController.delete(req, res).catch(next) })
router.post('/:id/payments', rbac('invoices', 'update'), (req, res, next) => { invoicesController.recordPayment(req, res).catch(next) })
router.post('/:id/send', rbac('invoices', 'update'), (req, res, next) => { invoicesController.send(req, res).catch(next) })

export { router as invoiceRoutes }
