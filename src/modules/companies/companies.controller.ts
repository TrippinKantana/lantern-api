import type { Request, Response } from 'express'
import { companiesService } from './companies.service.js'

export class CompaniesController {
  async list(req: Request, res: Response) {
    const result = await companiesService.list(req.query as Record<string, string>)
    res.json({ status: 'success', ...result })
  }

  async getById(req: Request, res: Response) {
    const id = String(req.params.id)
    const company = await companiesService.getById(id)
    res.json({ status: 'success', data: company })
  }

  async create(req: Request, res: Response) {
    const company = await companiesService.create(req.body)
    res.status(201).json({ status: 'success', data: company })
  }

  async update(req: Request, res: Response) {
    const id = String(req.params.id)
    const company = await companiesService.update(id, req.body)
    res.json({ status: 'success', data: company })
  }

  async delete(req: Request, res: Response) {
    const id = String(req.params.id)
    await companiesService.delete(id)
    res.json({ status: 'success', data: null })
  }

  async assignRep(req: Request, res: Response) {
    const id = String(req.params.id)
    const rep = await companiesService.assignRep(id, req.body)
    res.status(201).json({ status: 'success', data: rep })
  }

  async getUsers(req: Request, res: Response) {
    const id = String(req.params.id)
    const result = await companiesService.getUsers(id, req.query as Record<string, string>)
    res.json({ status: 'success', ...result })
  }
  async addContact(req: Request, res: Response) {
    const contact = await companiesService.addContact(String(req.params.id), req.body)
    res.status(201).json({ status: 'success', data: contact })
  }

  async updateContact(req: Request, res: Response) {
    const contact = await companiesService.updateContact(String(req.params.contactId), req.body)
    res.json({ status: 'success', data: contact })
  }

  async deleteContact(req: Request, res: Response) {
    await companiesService.deleteContact(String(req.params.contactId))
    res.json({ status: 'success', data: null })
  }
}

export const companiesController = new CompaniesController()
