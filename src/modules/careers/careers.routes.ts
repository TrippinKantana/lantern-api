import { Router } from 'express'
import { careersController } from './careers.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { validate } from '../../middleware/validate.js'
import { audit } from '../../middleware/audit.js'
import { createJobSchema, updateJobSchema, updateApplicationSchema } from './careers.schema.js'

const router = Router()
router.use(auth())
router.use(audit('jobs'))

router.get('/', rbac('jobs', 'read'), (req, res, next) => { careersController.list(req, res).catch(next) })
router.post('/', rbac('jobs', 'create'), validate(createJobSchema), (req, res, next) => { careersController.create(req, res).catch(next) })

router.get('/applications/:id', rbac('job_applications', 'read'), (req, res, next) => { careersController.getApplication(req, res).catch(next) })
router.patch('/applications/:id', rbac('job_applications', 'update'), validate(updateApplicationSchema), (req, res, next) => { careersController.updateApplication(req, res).catch(next) })
router.get('/applications/:id/resume', rbac('job_applications', 'read'), (req, res, next) => { careersController.downloadResume(req, res).catch(next) })

router.get('/:id', rbac('jobs', 'read'), (req, res, next) => { careersController.getById(req, res).catch(next) })
router.patch('/:id', rbac('jobs', 'update'), validate(updateJobSchema), (req, res, next) => { careersController.update(req, res).catch(next) })
router.delete('/:id', rbac('jobs', 'delete'), (req, res, next) => { careersController.delete(req, res).catch(next) })
router.get('/:id/applications', rbac('job_applications', 'read'), (req, res, next) => { careersController.listApplications(req, res).catch(next) })

export { router as careersRoutes }
