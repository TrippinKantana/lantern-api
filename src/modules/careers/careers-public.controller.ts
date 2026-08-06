import type { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import { config } from '../../config/index.js'
import { careersService } from './careers.service.js'

export const careersPublicController = {
  async list(req: Request, res: Response) {
    const result = await careersService.listPublished(req.query)
    res.json({ status: 'success', ...result })
  },

  async getBySlug(req: Request, res: Response) {
    const job = await careersService.getPublishedBySlug(String(req.params.slug))
    res.json({ status: 'success', data: job })
  },

  async apply(req: Request, res: Response) {
    const { fullName, email, phone, linkedinUrl, portfolioUrl, coverNote } = req.body

    if (!fullName || !email) {
      res.status(400).json({ status: 'error', message: 'Name and email are required' })
      return
    }

    let resume: { key: string; name: string } | undefined
    const file = req.file
    if (file) {
      const ext = path.extname(file.originalname)
      const storageKey = `resumes/${uuid()}${ext}`
      const destPath = path.join(config.upload.dir, storageKey)
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.writeFileSync(destPath, file.buffer)
      resume = { key: storageKey, name: file.originalname }
    }

    try {
      await careersService.apply(String(req.params.id), { fullName, email, phone, linkedinUrl, portfolioUrl, coverNote }, resume)
      res.status(201).json({ status: 'success', message: 'Thank you for applying. We will be in touch shortly.' })
    } catch {
      res.status(404).json({ status: 'error', message: 'This position is no longer accepting applications.' })
    }
  },
}
