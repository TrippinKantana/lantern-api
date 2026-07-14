import type { Request, Response } from 'express'
import { announcementsService } from './announcements.service.js'

export const announcementsController = {
  async list(req: Request, res: Response) {
    const result = await announcementsService.list(req.query, req.user!.role, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },
  async getById(req: Request, res: Response) {
    const item = await announcementsService.getById(String(req.params.id))
    res.json({ status: 'success', data: item })
  },
  async create(req: Request, res: Response) {
    const item = await announcementsService.create(req.body)
    res.status(201).json({ status: 'success', data: item })
  },
  async update(req: Request, res: Response) {
    const item = await announcementsService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data: item })
  },
  async delete(req: Request, res: Response) {
    await announcementsService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
}
