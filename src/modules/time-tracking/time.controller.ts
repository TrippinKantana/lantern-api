import type { Request, Response } from 'express'
import { timeService } from './time.service.js'

export const timeController = {
  async list(req: Request, res: Response) {
    const result = await timeService.list(req.query, req.user!.id)
    res.json({ status: 'success', ...result })
  },
  async create(req: Request, res: Response) {
    const entry = await timeService.create(req.body, req.user!.id)
    res.status(201).json({ status: 'success', data: entry })
  },
  async update(req: Request, res: Response) {
    const entry = await timeService.update(String(req.params.id), req.body, req.user!.id)
    res.json({ status: 'success', data: entry })
  },
  async stop(req: Request, res: Response) {
    const entry = await timeService.stop(String(req.params.id), req.user!.id)
    res.json({ status: 'success', data: entry })
  },
  async delete(req: Request, res: Response) {
    await timeService.delete(String(req.params.id), req.user!.id)
    res.json({ status: 'success', data: null })
  },
  async weekSummary(req: Request, res: Response) {
    const summary = await timeService.weekSummary(req.user!.id)
    res.json({ status: 'success', data: summary })
  },
}
