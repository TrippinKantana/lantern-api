import type { Request, Response } from 'express'
import { crmService } from './crm.service.js'

export const crmController = {
  async listLeads(req: Request, res: Response) {
    const result = await crmService.listLeads(req.query)
    res.json({ status: 'success', ...result })
  },

  async getLeadById(req: Request, res: Response) {
    const lead = await crmService.getLeadById(String(req.params.id))
    res.json({ status: 'success', data: lead })
  },

  async createLead(req: Request, res: Response) {
    const lead = await crmService.createLead(req.body)
    res.status(201).json({ status: 'success', data: lead })
  },

  async updateLead(req: Request, res: Response) {
    const lead = await crmService.updateLead(String(req.params.id), req.body)
    res.json({ status: 'success', data: lead })
  },

  async deleteLead(req: Request, res: Response) {
    await crmService.deleteLead(String(req.params.id))
    res.json({ status: 'success', data: null })
  },

  async addActivity(req: Request, res: Response) {
    const activity = await crmService.addActivity(String(req.params.id), req.body)
    res.status(201).json({ status: 'success', data: activity })
  },

  async getPipeline(req: Request, res: Response) {
    const pipeline = await crmService.getPipelineSummary()
    res.json({ status: 'success', data: pipeline })
  },

  async convertToCompany(req: Request, res: Response) {
    const result = await crmService.convertToCompany(String(req.params.id))
    res.json({ status: 'success', data: result })
  },
}
