import type { Request, Response } from 'express'
import { usersService } from './users.service.js'

export class UsersController {
  async list(req: Request, res: Response) {
    const result = await usersService.list(req.query as Record<string, string>)
    res.json({ status: 'success', ...result })
  }

  async getById(req: Request, res: Response) {
    const id = String(req.params.id)
    const user = await usersService.getById(id)
    res.json({ status: 'success', data: user })
  }

  async create(req: Request, res: Response) {
    const user = await usersService.create(req.body)
    res.status(201).json({ status: 'success', data: user })
  }

  async update(req: Request, res: Response) {
    const id = String(req.params.id)
    const user = await usersService.update(id, req.body)
    res.json({ status: 'success', data: user })
  }

  async delete(req: Request, res: Response) {
    const id = String(req.params.id)
    await usersService.delete(id)
    res.json({ status: 'success', data: null })
  }

  async invite(req: Request, res: Response) {
    const invite = await usersService.invite(req.body, req.user!.id)
    res.status(201).json({ status: 'success', data: invite })
  }

  async generateCredentials(req: Request, res: Response) {
    const id = String(req.params.id)
    const result = await usersService.generateCredentials(id)
    res.json({ status: 'success', data: result })
  }
}

export const usersController = new UsersController()
