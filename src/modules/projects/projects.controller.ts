import type { Request, Response } from 'express'
import { projectsService } from './projects.service.js'

export const projectsController = {
  async list(req: Request, res: Response) {
    const result = await projectsService.list(req.query as any, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },

  async getById(req: Request, res: Response) {
    const project = await projectsService.getById(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: project })
  },

  async create(req: Request, res: Response) {
    const project = await projectsService.create(req.body)
    res.status(201).json({ status: 'success', data: project })
  },

  async update(req: Request, res: Response) {
    const project = await projectsService.update(String(req.params.id), req.body, req.user!.companyId)
    res.json({ status: 'success', data: project })
  },

  async delete(req: Request, res: Response) {
    await projectsService.delete(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: null })
  },

  async listMilestones(req: Request, res: Response) {
    const milestones = await projectsService.listMilestones(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: milestones })
  },

  async createMilestone(req: Request, res: Response) {
    const milestone = await projectsService.createMilestone(String(req.params.id), req.body, req.user!.companyId)
    res.status(201).json({ status: 'success', data: milestone })
  },
}
