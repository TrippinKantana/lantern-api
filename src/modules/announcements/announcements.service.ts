import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const announcementsService = {
  async list(filters: any, userRole: string, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}

    if (userCompanyId) {
      where.OR = [{ companyId: userCompanyId }, { companyId: null }]
      where.isPublished = true
      where.audience = { in: ['all', 'clients'] }
    } else {
      if (filters.audience) where.audience = filters.audience
      if (filters.companyId) where.companyId = filters.companyId
    }

    const now = new Date()
    if (userCompanyId) {
      where.OR = where.OR?.map((c: any) => ({
        ...c,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      }))
    }

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.announcement.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string) {
    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement) throw new NotFoundError('Announcement')
    return announcement
  },

  async create(data: any) {
    return prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type || 'general',
        audience: data.audience || 'all',
        companyId: data.companyId,
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? new Date() : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    })
  },

  async update(id: string, data: any) {
    await this.getById(id)
    const updateData: any = { ...data }
    if (data.isPublished && !data.publishedAt) updateData.publishedAt = new Date()
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt)
    return prisma.announcement.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.announcement.delete({ where: { id } })
  },
}
