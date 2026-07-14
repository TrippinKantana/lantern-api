import { prisma } from '../../config/database.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const auditLogsService = {
  async list(filters: any) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (filters.userId) where.userId = filters.userId
    if (filters.companyId) where.companyId = filters.companyId
    if (filters.resource) where.resource = filters.resource
    if (filters.action) where.action = filters.action
    if (filters.startDate && filters.endDate) {
      where.createdAt = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) }
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },
}
