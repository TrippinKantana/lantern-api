import { Router } from 'express'
import { kbController } from './kb.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'

const router = Router()
router.use(auth())

router.get('/', rbac('knowledge_base', 'read'), (req, res, next) => { kbController.list(req, res).catch(next) })
router.post('/', rbac('knowledge_base', 'create'), (req, res, next) => { kbController.create(req, res).catch(next) })
router.get('/:id', rbac('knowledge_base', 'read'), (req, res, next) => { kbController.getById(req, res).catch(next) })
router.patch('/:id', rbac('knowledge_base', 'update'), (req, res, next) => { kbController.update(req, res).catch(next) })
router.delete('/:id', rbac('knowledge_base', 'update'), (req, res, next) => { kbController.delete(req, res).catch(next) })

export { router as kbRoutes }
