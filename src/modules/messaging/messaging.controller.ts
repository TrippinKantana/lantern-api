import type { Request, Response } from 'express'
import { messagingService } from './messaging.service.js'

export const messagingController = {
  async listChannels(req: Request, res: Response) {
    const channels = await messagingService.listChannels(req.user!.id)
    res.json({ status: 'success', data: channels })
  },

  async createChannel(req: Request, res: Response) {
    const channel = await messagingService.createChannel(req.body, req.user!.id, req.body.memberIds)
    res.status(201).json({ status: 'success', data: channel })
  },

  async getMessages(req: Request, res: Response) {
    const result = await messagingService.getMessages(String(req.params.id), req.user!.id, req.query)
    res.json({ status: 'success', ...result })
  },

  async sendMessage(req: Request, res: Response) {
    const message = await messagingService.sendMessage(
      String(req.params.id), req.user!.id, req.body.content, req.body.isInternal,
    )
    res.status(201).json({ status: 'success', data: message })
  },
}
