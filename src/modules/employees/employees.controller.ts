import type { Request, Response } from 'express'
import { employeesService } from './employees.service.js'

export const employeesController = {
  async getProfile(req: Request, res: Response) {
    const data = await employeesService.getProfile(String(req.params.id))
    res.json({ status: 'success', data })
  },

  async updateProfile(req: Request, res: Response) {
    const data = await employeesService.updateProfile(String(req.params.id), req.body)
    res.json({ status: 'success', data })
  },

  async generateId(req: Request, res: Response) {
    const data = await employeesService.generateEmployeeIdAndBarcode(String(req.params.id))
    res.json({ status: 'success', data })
  },

  async getIdCard(req: Request, res: Response) {
    const data = await employeesService.getIdCard(String(req.params.id))
    res.json({ status: 'success', data })
  },

  async listContracts(req: Request, res: Response) {
    const data = await employeesService.listContracts(String(req.params.id))
    res.json({ status: 'success', data })
  },

  async createContract(req: Request, res: Response) {
    const data = await employeesService.createContract(String(req.params.id), req.body)
    res.status(201).json({ status: 'success', data })
  },

  async updateContract(req: Request, res: Response) {
    const data = await employeesService.updateContract(String(req.params.contractId), req.body)
    res.json({ status: 'success', data })
  },
}
