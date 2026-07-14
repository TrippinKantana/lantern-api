import { Router } from 'express'
import { projectsController } from './projects.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('projects'))

router.get('/', rbac('projects', 'read'), (req, res, next) => { projectsController.list(req, res).catch(next) })
router.post('/', rbac('projects', 'create'), (req, res, next) => { projectsController.create(req, res).catch(next) })
router.get('/:id', rbac('projects', 'read'), (req, res, next) => { projectsController.getById(req, res).catch(next) })
router.patch('/:id', rbac('projects', 'update'), (req, res, next) => { projectsController.update(req, res).catch(next) })
router.delete('/:id', rbac('projects', 'delete'), (req, res, next) => { projectsController.delete(req, res).catch(next) })
router.get('/:id/milestones', rbac('projects', 'read'), (req, res, next) => { projectsController.listMilestones(req, res).catch(next) })
router.post('/:id/milestones', rbac('projects', 'update'), (req, res, next) => { projectsController.createMilestone(req, res).catch(next) })

export { router as projectRoutes }
