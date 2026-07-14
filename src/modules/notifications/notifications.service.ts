import { prisma } from '../../config/database.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const notificationsService = {
  async list(userId: string, filters: any) {
    const { page, limit } = parsePagination(filters)
    const where: any = { userId }
    if (filters.read !== undefined) where.read = filters.read === 'true'

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ])
    return { ...paginatedResponse(data, total, { page, limit }), unreadCount }
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  },

  async create(data: { userId: string; type: string; title: string; body?: string; link?: string }) {
    return prisma.notification.create({ data })
  },
}
