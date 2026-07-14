import type { Request, Response } from 'express'
import { calendarService } from './calendar.service.js'

export const calendarController = {
  async listEvents(req: Request, res: Response) {
    const events = await calendarService.listEvents(req.query, req.user!.id)
    res.json({ status: 'success', data: events })
  },
  async getById(req: Request, res: Response) {
    const event = await calendarService.getById(String(req.params.id))
    res.json({ status: 'success', data: event })
  },
  async create(req: Request, res: Response) {
    const event = await calendarService.create(req.body, req.user!.id)
    res.status(201).json({ status: 'success', data: event })
  },
  async update(req: Request, res: Response) {
    const event = await calendarService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data: event })
  },
  async delete(req: Request, res: Response) {
    await calendarService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
  async rsvp(req: Request, res: Response) {
    const result = await calendarService.rsvp(String(req.params.id), req.user!.id, req.body.status)
    res.json({ status: 'success', data: result })
  },
}
