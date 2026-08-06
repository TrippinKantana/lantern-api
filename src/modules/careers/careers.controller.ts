import type { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { careersService } from './careers.service.js'
import { config } from '../../config/index.js'

export const careersController = {
  async list(req: Request, res: Response) {
    const result = await careersService.list(req.query)
    res.json({ status: 'success', ...result })
  },
  async getById(req: Request, res: Response) {
    const data = await careersService.getById(String(req.params.id))
    res.json({ status: 'success', data })
  },
  async create(req: Request, res: Response) {
    const data = await careersService.create(req.body, req.user!.id)
    res.status(201).json({ status: 'success', data })
  },
  async update(req: Request, res: Response) {
    const data = await careersService.update(String(req.params.id), req.body)
    res.json({ status: 'success', data })
  },
  async delete(req: Request, res: Response) {
    await careersService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
  async listApplications(req: Request, res: Response) {
    const result = await careersService.listApplications(String(req.params.id), req.query)
    res.json({ status: 'success', ...result })
  },
  async getApplication(req: Request, res: Response) {
    const data = await careersService.getApplicationById(String(req.params.id))
    res.json({ status: 'success', data })
  },
  async updateApplication(req: Request, res: Response) {
    const data = await careersService.updateApplication(String(req.params.id), req.body)
    res.json({ status: 'success', data })
  },
  async downloadResume(req: Request, res: Response) {
    const application = await careersService.getApplicationById(String(req.params.id))
    if (!application.resumeKey) {
      res.status(404).json({ status: 'error', message: 'No resume on file' })
      return
    }
    const filePath = path.resolve(config.upload.dir, application.resumeKey)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ status: 'error', message: 'File not found on disk' })
      return
    }
    res.setHeader('Content-Disposition', `attachment; filename="${application.resumeName || 'resume'}"`)
    fs.createReadStream(filePath).pipe(res)
  },
}
