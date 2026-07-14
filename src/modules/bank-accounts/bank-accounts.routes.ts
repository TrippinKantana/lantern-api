import { Router } from 'express'
import { bankAccountsController } from './bank-accounts.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('bank_accounts'))

router.get('/', rbac('invoices', 'read'), (req, res, next) => { bankAccountsController.list(req, res).catch(next) })
router.get('/summary', rbac('invoices', 'read'), (req, res, next) => { bankAccountsController.getSummary(req, res).catch(next) })
router.get('/:id', rbac('invoices', 'read'), (req, res, next) => { bankAccountsController.getById(req, res).catch(next) })
router.post('/', rbac('invoices', 'create'), (req, res, next) => { bankAccountsController.create(req, res).catch(next) })
router.patch('/:id', rbac('invoices', 'update'), (req, res, next) => { bankAccountsController.update(req, res).catch(next) })
router.delete('/:id', rbac('invoices', 'delete'), (req, res, next) => { bankAccountsController.delete(req, res).catch(next) })
router.post('/:id/funds', rbac('invoices', 'create'), (req, res, next) => { bankAccountsController.addFunds(req, res).catch(next) })

export { router as bankAccountRoutes }
