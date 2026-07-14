import type { Request, Response } from 'express'
import { expensesService } from './expenses.service.js'

export const expensesController = {
  async list(req: Request, res: Response) {
    const result = await expensesService.list(req.query)
    res.json({ status: 'success', ...result })
  },
  async getById(req: Request, res: Response) {
    const data = await expensesService.getById(String(req.params.id))
    res.json({ status: 'success', data })
  },
  async create(req: Request, res: Response) {
    const data = await expensesService.create(req.body, req.user!.id)
    res.status(201).json({ status: 'success', data })
  },
  async update(req: Request, res: Response) {
    const data = await expensesService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data })
  },
  async delete(req: Request, res: Response) {
    await expensesService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
  async getSummary(req: Request, res: Response) {
    const data = await expensesService.getSummary(req.query)
    res.json({ status: 'success', data })
  },
}
