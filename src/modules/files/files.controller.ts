import type { Request, Response } from 'express'
import { filesService } from './files.service.js'
import path from 'path'
import fs from 'fs'
import { config } from '../../config/index.js'
import { v4 as uuid } from 'uuid'

export const filesController = {
  async list(req: Request, res: Response) {
    const result = await filesService.list(req.query, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },

  async upload(req: Request, res: Response) {
    const file = req.file
    if (!file) {
      res.status(400).json({ status: 'error', message: 'No file provided' })
      return
    }

    const ext = path.extname(file.originalname)
    const storageKey = `${uuid()}${ext}`
    const destPath = path.join(config.upload.dir, storageKey)

    // Ensure upload dir exists
    fs.mkdirSync(config.upload.dir, { recursive: true })

    // Move from multer temp to final location
    fs.renameSync(file.path, destPath)

    const record = await filesService.create({
      name: file.originalname.replace(ext, ''),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      uploadedById: req.user!.id,
      companyId: req.body.companyId || req.user!.companyId || undefined,
      projectId: req.body.projectId,
      ticketId: req.body.ticketId,
      contractId: req.body.contractId,
    })
    res.status(201).json({ status: 'success', data: record })
  },

  async download(req: Request, res: Response) {
    const file = await filesService.getById(String(req.params.id))
    const filePath = path.resolve(config.upload.dir, file.storageKey)

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ status: 'error', message: 'File not found on disk' })
      return
    }

    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`)
    fs.createReadStream(filePath).pipe(res)
  },

  async delete(req: Request, res: Response) {
    const file = await filesService.getById(String(req.params.id))
    const filePath = path.resolve(config.upload.dir, file.storageKey)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await filesService.delete(String(req.params.id))
    res.json({ status: 'success', data: null })
  },
}
