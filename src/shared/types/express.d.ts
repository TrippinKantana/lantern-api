import type { UserRole } from '../../generated/prisma/client.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
        companyId: string | null
        firstName: string
        lastName: string
      }
      tenantFilter?: { companyId?: string }
    }
  }
}

export {}
