import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database.js'
import { verifyAccessToken } from '../shared/utils/jwt.js'
import { UnauthorizedError } from '../shared/utils/errors.js'

export function auth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing access token')
    }

    const token = header.slice(7)
    try {
      const payload = verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          companyId: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      })

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive')
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
      }
      next()
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err
      throw new UnauthorizedError('Invalid or expired token')
    }
  }
}
