import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database.js'
import { ForbiddenError, UnauthorizedError } from '../shared/utils/errors.js'
import type { UserRole } from '../generated/prisma/client.js'

export function rbac(resource: string, action: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError()

    if (req.user.role === 'SUPER_ADMIN') {
      next()
      return
    }

    const userOverride = await prisma.userPermission.findFirst({
      where: {
        userId: req.user.id,
        permission: { resource, action },
      },
      include: { permission: true },
    })

    if (userOverride) {
      if (userOverride.granted) { next(); return }
      throw new ForbiddenError('You do not have permission to perform this action')
    }

    const roleDefault = await prisma.roleDefaultPermission.findFirst({
      where: {
        role: req.user.role as UserRole,
        permission: { resource, action },
      },
    })

    if (roleDefault) { next(); return }

    throw new ForbiddenError('You do not have permission to perform this action')
  }
}
