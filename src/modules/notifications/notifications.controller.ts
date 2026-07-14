import type { Request, Response } from 'express'
import { notificationsService } from './notifications.service.js'

export const notificationsController = {
  async list(req: Request, res: Response) {
    const result = await notificationsService.list(req.user!.id, req.query)
    res.json({ status: 'success', ...result })
  },
  async markRead(req: Request, res: Response) {
    await notificationsService.markRead(String(req.params.id), req.user!.id)
    res.json({ status: 'success', data: null })
  },
  async markAllRead(req: Request, res: Response) {
    await notificationsService.markAllRead(req.user!.id)
    res.json({ status: 'success', data: null })
  },
}
