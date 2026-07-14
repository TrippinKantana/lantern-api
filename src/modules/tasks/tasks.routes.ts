import { Router } from 'express'
import { tasksController } from './tasks.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('tasks'))

router.get('/', rbac('tasks', 'read'), (req, res, next) => { tasksController.list(req, res).catch(next) })
router.post('/', rbac('tasks', 'create'), (req, res, next) => { tasksController.create(req, res).catch(next) })
router.get('/:id', rbac('tasks', 'read'), (req, res, next) => { tasksController.getById(req, res).catch(next) })
router.patch('/:id', rbac('tasks', 'update'), (req, res, next) => { tasksController.update(req, res).catch(next) })
router.delete('/:id', rbac('tasks', 'delete'), (req, res, next) => { tasksController.delete(req, res).catch(next) })
router.post('/:id/comments', rbac('tasks', 'update'), (req, res, next) => { tasksController.addComment(req, res).catch(next) })

export { router as taskRoutes }
