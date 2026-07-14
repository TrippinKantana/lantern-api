import { Router } from 'express'
import { companiesController } from './companies.controller.js'
import { subscriptionsController } from './subscriptions.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { validate } from '../../middleware/validate.js'
import { audit } from '../../middleware/audit.js'
import { createCompanySchema, updateCompanySchema, assignRepSchema } from './companies.schema.js'

const router = Router()

router.use(auth())
router.use(audit('companies'))

// Service catalog (all predefined services)
router.get('/catalog', (req, res, next) => { subscriptionsController.getCatalog(req, res).catch(next) })

router.get('/', rbac('companies', 'read'), (req, res, next) => { companiesController.list(req, res).catch(next) })
router.post('/', rbac('companies', 'create'), validate(createCompanySchema), (req, res, next) => { companiesController.create(req, res).catch(next) })
router.get('/:id', rbac('companies', 'read'), (req, res, next) => { companiesController.getById(req, res).catch(next) })
router.patch('/:id', rbac('companies', 'update'), validate(updateCompanySchema), (req, res, next) => { companiesController.update(req, res).catch(next) })
router.delete('/:id', rbac('companies', 'delete'), (req, res, next) => { companiesController.delete(req, res).catch(next) })
router.post('/:id/reps', rbac('companies', 'update'), validate(assignRepSchema), (req, res, next) => { companiesController.assignRep(req, res).catch(next) })
router.get('/:id/users', rbac('companies', 'read'), (req, res, next) => { companiesController.getUsers(req, res).catch(next) })

// Contacts
router.post('/:id/contacts', rbac('companies', 'update'), (req, res, next) => { companiesController.addContact(req, res).catch(next) })
router.patch('/:id/contacts/:contactId', rbac('companies', 'update'), (req, res, next) => { companiesController.updateContact(req, res).catch(next) })
router.delete('/:id/contacts/:contactId', rbac('companies', 'update'), (req, res, next) => { companiesController.deleteContact(req, res).catch(next) })

// Subscriptions
router.get('/:id/subscriptions', rbac('companies', 'read'), (req, res, next) => { subscriptionsController.list(req, res).catch(next) })
router.post('/:id/subscriptions', rbac('companies', 'update'), (req, res, next) => { subscriptionsController.add(req, res).catch(next) })
router.post('/:id/subscriptions/bulk', rbac('companies', 'update'), (req, res, next) => { subscriptionsController.addMultiple(req, res).catch(next) })
router.patch('/:id/subscriptions/:subId', rbac('companies', 'update'), (req, res, next) => { subscriptionsController.update(req, res).catch(next) })
router.delete('/:id/subscriptions/:subId', rbac('companies', 'update'), (req, res, next) => { subscriptionsController.remove(req, res).catch(next) })

export { router as companyRoutes }
