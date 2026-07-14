import { Router } from 'express'
import { departmentsController } from './departments.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'

const router = Router()
router.use(auth())

router.get('/', (req, res, next) => { departmentsController.list(req, res).catch(next) })
router.get('/:id', (req, res, next) => { departmentsController.getById(req, res).catch(next) })
router.post('/', rbac('users', 'create'), (req, res, next) => { departmentsController.create(req, res).catch(next) })
router.patch('/:id', rbac('users', 'update'), (req, res, next) => { departmentsController.update(req, res).catch(next) })
router.delete('/:id', rbac('users', 'delete'), (req, res, next) => { departmentsController.delete(req, res).catch(next) })

export { router as departmentRoutes }
