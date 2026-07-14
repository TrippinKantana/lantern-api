import type { Request, Response } from 'express'
import { kbService } from './kb.service.js'

export const kbController = {
  async list(req: Request, res: Response) {
    const result = await kbService.list(req.query, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },
  async getById(req: Request, res: Response) {
    const article = await kbService.getById(String(req.params.id))
    res.json({ status: 'success', data: article })
  },
  async create(req: Request, res: Response) {
    const article = await kbService.create(req.body)
    res.status(201).json({ status: 'success', data: article })
  },
  async update(req: Request, res: Response) {
    const article = await kbService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data: article })
  },
  async delete(req: Request, res: Response) {
    await kbService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
}
