import type { Request, Response } from 'express'
import { subscriptionsService } from './subscriptions.service.js'

export const subscriptionsController = {
  async getCatalog(_req: Request, res: Response) {
    const catalog = await subscriptionsService.getCatalog()
    res.json({ status: 'success', data: catalog })
  },

  async list(req: Request, res: Response) {
    const data = await subscriptionsService.listForCompany(String(req.params.id))
    res.json({ status: 'success', data })
  },

  async add(req: Request, res: Response) {
    const sub = await subscriptionsService.add(String(req.params.id), req.body)
    res.status(201).json({ status: 'success', data: sub })
  },

  async addMultiple(req: Request, res: Response) {
    const subs = await subscriptionsService.addMultiple(String(req.params.id), req.body.items)
    res.status(201).json({ status: 'success', data: subs })
  },

  async update(req: Request, res: Response) {
    const sub = await subscriptionsService.update(String(req.params.subId), req.body)
    res.json({ status: 'success', data: sub })
  },

  async remove(req: Request, res: Response) {
    await subscriptionsService.remove(String(req.params.subId))
    res.json({ status: 'success', data: null })
  },
}
