import type { Request, Response } from 'express'
import { ticketsService } from './tickets.service.js'

export const ticketsController = {
  async list(req: Request, res: Response) {
    const result = await ticketsService.list(req.query, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },

  async getById(req: Request, res: Response) {
    const ticket = await ticketsService.getById(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: ticket })
  },

  async create(req: Request, res: Response) {
    const companyId = req.body.companyId || req.user!.companyId
    const ticket = await ticketsService.create({ ...req.body, companyId }, req.user!.id)
    res.status(201).json({ status: 'success', data: ticket })
  },

  async update(req: Request, res: Response) {
    const ticket = await ticketsService.update(String(req.params.id), req.body, req.user!.companyId)
    res.json({ status: 'success', data: ticket })
  },

  async addComment(req: Request, res: Response) {
    const comment = await ticketsService.addComment(
      String(req.params.id), req.user!.id, req.body.content, req.body.isInternal, req.user!.companyId,
    )
    res.status(201).json({ status: 'success', data: comment })
  },
}
