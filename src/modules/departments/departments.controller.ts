import type { Request, Response } from 'express'
import { departmentsService } from './departments.service.js'

export const departmentsController = {
  async list(_req: Request, res: Response) {
    const data = await departmentsService.list()
    res.json({ status: 'success', data })
  },
  async getById(req: Request, res: Response) {
    const data = await departmentsService.getById(String(req.params.id))
    res.json({ status: 'success', data })
  },
  async create(req: Request, res: Response) {
    const data = await departmentsService.create(req.body)
    res.status(201).json({ status: 'success', data })
  },
  async update(req: Request, res: Response) {
    const data = await departmentsService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data })
  },
  async delete(req: Request, res: Response) {
    await departmentsService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
}
