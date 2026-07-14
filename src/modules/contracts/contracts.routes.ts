import { Router } from 'express'
import { contractsController } from './contracts.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('contracts'))

router.get('/', rbac('contracts', 'read'), (req, res, next) => { contractsController.list(req, res).catch(next) })
router.post('/', rbac('contracts', 'create'), (req, res, next) => { contractsController.create(req, res).catch(next) })
router.get('/:id', rbac('contracts', 'read'), (req, res, next) => { contractsController.getById(req, res).catch(next) })
router.patch('/:id', rbac('contracts', 'update'), (req, res, next) => { contractsController.update(req, res).catch(next) })

export { router as contractRoutes }
