import type { Request, Response } from 'express'
import { contractsService } from './contracts.service.js'

export const contractsController = {
  async list(req: Request, res: Response) {
    const result = await contractsService.list(req.query, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },
  async getById(req: Request, res: Response) {
    const contract = await contractsService.getById(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: contract })
  },
  async create(req: Request, res: Response) {
    const contract = await contractsService.create(req.body)
    res.status(201).json({ status: 'success', data: contract })
  },
  async update(req: Request, res: Response) {
    const contract = await contractsService.update(String(req.params.id), req.body, req.user!.companyId)
    res.json({ status: 'success', data: contract })
  },
}
