import type { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from '../shared/utils/errors.js'

export function tenantScope() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError()

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'LANTERN_STAFF' || req.user.role === 'PROJECT_MANAGER' || req.user.role === 'SUPPORT_AGENT' || req.user.role === 'FINANCE_MANAGER') {
      req.tenantFilter = req.query.companyId
        ? { companyId: req.query.companyId as string }
        : {}
    } else {
      if (!req.user.companyId) throw new UnauthorizedError('No company associated')
      req.tenantFilter = { companyId: req.user.companyId }
    }
    next()
  }
}
