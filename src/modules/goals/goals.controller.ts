import type { Request, Response } from 'express'
import { goalsService } from './goals.service.js'

export const goalsController = {
  async list(req: Request, res: Response) {
    const result = await goalsService.list(req.query)
    res.json({ status: 'success', ...result })
  },
  async getById(req: Request, res: Response) {
    const goal = await goalsService.getById(String(req.params.id))
    res.json({ status: 'success', data: goal })
  },
  async create(req: Request, res: Response) {
    const goal = await goalsService.create(req.body)
    res.status(201).json({ status: 'success', data: goal })
  },
  async update(req: Request, res: Response) {
    const goal = await goalsService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data: goal })
  },
  async delete(req: Request, res: Response) {
    await goalsService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
}
