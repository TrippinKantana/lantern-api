import type { Request, Response } from 'express'
import { tasksService } from './tasks.service.js'

export const tasksController = {
  async list(req: Request, res: Response) {
    const result = await tasksService.list(req.query, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },

  async getById(req: Request, res: Response) {
    const task = await tasksService.getById(String(req.params.id))
    res.json({ status: 'success', data: task })
  },

  async create(req: Request, res: Response) {
    const task = await tasksService.create(req.body, req.user!.id)
    res.status(201).json({ status: 'success', data: task })
  },

  async update(req: Request, res: Response) {
    const task = await tasksService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data: task })
  },

  async delete(req: Request, res: Response) {
    await tasksService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },

  async addComment(req: Request, res: Response) {
    const comment = await tasksService.addComment(
      String(req.params.id), req.user!.id, req.body.content, req.body.isInternal,
    )
    res.status(201).json({ status: 'success', data: comment })
  },
}
