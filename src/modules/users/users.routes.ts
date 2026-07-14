import { Router } from 'express'
import { usersController } from './users.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import { validate } from '../../middleware/validate.js'
import { audit } from '../../middleware/audit.js'
import { createUserSchema, updateUserSchema, inviteUserSchema } from './users.schema.js'

const router = Router()

router.use(auth())
router.use(audit('users'))

router.get('/', rbac('users', 'read'), (req, res, next) => { usersController.list(req, res).catch(next) })
router.post('/', rbac('users', 'create'), validate(createUserSchema), (req, res, next) => { usersController.create(req, res).catch(next) })
router.post('/invite', rbac('users', 'create'), validate(inviteUserSchema), (req, res, next) => { usersController.invite(req, res).catch(next) })
router.get('/:id', rbac('users', 'read'), (req, res, next) => { usersController.getById(req, res).catch(next) })
router.patch('/:id', rbac('users', 'update'), validate(updateUserSchema), (req, res, next) => { usersController.update(req, res).catch(next) })
router.delete('/:id', rbac('users', 'delete'), (req, res, next) => { usersController.delete(req, res).catch(next) })
router.post('/:id/credentials', rbac('users', 'update'), (req, res, next) => { usersController.generateCredentials(req, res).catch(next) })

export { router as userRoutes }
