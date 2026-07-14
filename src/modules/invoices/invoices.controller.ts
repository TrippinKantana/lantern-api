import type { Request, Response } from 'express'
import { invoicesService } from './invoices.service.js'

export const invoicesController = {
  async list(req: Request, res: Response) {
    const result = await invoicesService.list(req.query, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },

  async getById(req: Request, res: Response) {
    const invoice = await invoicesService.getById(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: invoice })
  },

  async create(req: Request, res: Response) {
    const invoice = await invoicesService.create(req.body)
    res.status(201).json({ status: 'success', data: invoice })
  },

  async update(req: Request, res: Response) {
    const invoice = await invoicesService.update(String(req.params.id), req.body, req.user!.companyId)
    res.json({ status: 'success', data: invoice })
  },

  async send(req: Request, res: Response) {
    const invoice = await invoicesService.markSent(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: invoice })
  },
}
