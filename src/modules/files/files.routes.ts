import { Router } from 'express'
import { filesController } from './files.controller.js'
import { auth } from '../../middleware/auth.js'
import { rbac } from '../../middleware/rbac.js'
import multer from 'multer'
import { config } from '../../config/index.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const router = Router()
router.use(auth())

router.get('/', rbac('files', 'read'), (req, res, next) => { filesController.list(req, res).catch(next) })
router.post('/upload', rbac('files', 'create'), upload.single('file'), (req, res, next) => { filesController.upload(req, res).catch(next) })
router.get('/:id/download', rbac('files', 'read'), (req, res, next) => { filesController.download(req, res).catch(next) })
router.delete('/:id', rbac('files', 'delete'), (req, res, next) => { filesController.delete(req, res).catch(next) })

export { router as fileRoutes }
