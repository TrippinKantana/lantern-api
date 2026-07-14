import type { Request, Response } from 'express'
import { auditLogsService } from './audit-logs.service.js'

export const auditLogsController = {
  async list(req: Request, res: Response) {
    const result = await auditLogsService.list(req.query)
    res.json({ status: 'success', ...result })
  },
}
