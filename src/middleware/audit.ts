import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database.js'

const METHOD_TO_ACTION: Record<string, string> = {
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
  GET: 'read',
}

export function audit(resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.method !== 'GET') {
        prisma.auditLog.create({
          data: {
            userId: req.user?.id,
            companyId: req.user?.companyId || req.tenantFilter?.companyId,
            action: METHOD_TO_ACTION[req.method] || req.method.toLowerCase(),
            resource,
            resourceId: req.params.id ? String(req.params.id) : undefined,
            ipAddress: req.ip ? String(req.ip) : undefined,
            userAgent: req.headers['user-agent'],
          },
        }).catch(console.error)
      }
    })
    next()
  }
}
