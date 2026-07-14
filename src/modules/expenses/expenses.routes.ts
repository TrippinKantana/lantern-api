import { Router } from 'express'
import { expensesController } from './expenses.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('expenses'))

router.get('/', rbac('invoices', 'read'), (req, res, next) => { expensesController.list(req, res).catch(next) })
router.get('/summary', rbac('invoices', 'read'), (req, res, next) => { expensesController.getSummary(req, res).catch(next) })
router.post('/', rbac('invoices', 'create'), (req, res, next) => { expensesController.create(req, res).catch(next) })
router.get('/:id', rbac('invoices', 'read'), (req, res, next) => { expensesController.getById(req, res).catch(next) })
router.patch('/:id', rbac('invoices', 'update'), (req, res, next) => { expensesController.update(req, res).catch(next) })
router.delete('/:id', rbac('invoices', 'delete'), (req, res, next) => { expensesController.delete(req, res).catch(next) })

export { router as expenseRoutes }
