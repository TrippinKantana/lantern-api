import type { Request, Response } from 'express'
import { bankAccountsService } from './bank-accounts.service.js'

export const bankAccountsController = {
  async list(_req: Request, res: Response) {
    const data = await bankAccountsService.list()
    res.json({ status: 'success', data })
  },
  async getById(req: Request, res: Response) {
    const data = await bankAccountsService.getById(String(req.params.id))
    res.json({ status: 'success', data })
  },
  async create(req: Request, res: Response) {
    const data = await bankAccountsService.create(req.body)
    res.status(201).json({ status: 'success', data })
  },
  async update(req: Request, res: Response) {
    const data = await bankAccountsService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data })
  },
  async delete(req: Request, res: Response) {
    await bankAccountsService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
  async addFunds(req: Request, res: Response) {
    const data = await bankAccountsService.addFunds(String(req.params.id), req.body)
    res.json({ status: 'success', data })
  },
  async getSummary(_req: Request, res: Response) {
    const data = await bankAccountsService.getSummary()
    res.json({ status: 'success', data })
  },
}
