import { Router } from 'express'
import { goalsController } from './goals.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'

const router = Router()
router.use(auth())

router.get('/', rbac('goals', 'read'), (req, res, next) => { goalsController.list(req, res).catch(next) })
router.post('/', rbac('goals', 'create'), (req, res, next) => { goalsController.create(req, res).catch(next) })
router.get('/:id', rbac('goals', 'read'), (req, res, next) => { goalsController.getById(req, res).catch(next) })
router.patch('/:id', rbac('goals', 'update'), (req, res, next) => { goalsController.update(req, res).catch(next) })
router.delete('/:id', rbac('goals', 'update'), (req, res, next) => { goalsController.delete(req, res).catch(next) })

export { router as goalRoutes }
