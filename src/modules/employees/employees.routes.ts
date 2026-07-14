import { Router } from 'express'
import { employeesController } from './employees.controller.js'
import { auth } from '../../middleware/auth.js'
import { audit } from '../../middleware/audit.js'

const router = Router()
router.use(auth())
router.use(audit('employees'))

router.get('/:id/profile', (req, res, next) => { employeesController.getProfile(req, res).catch(next) })
router.patch('/:id/profile', (req, res, next) => { employeesController.updateProfile(req, res).catch(next) })
router.post('/:id/generate-id', (req, res, next) => { employeesController.generateId(req, res).catch(next) })
router.get('/:id/id-card', (req, res, next) => { employeesController.getIdCard(req, res).catch(next) })
router.get('/:id/contracts', (req, res, next) => { employeesController.listContracts(req, res).catch(next) })
router.post('/:id/contracts', (req, res, next) => { employeesController.createContract(req, res).catch(next) })
router.patch('/:id/contracts/:contractId', (req, res, next) => { employeesController.updateContract(req, res).catch(next) })

export { router as employeeRoutes }
