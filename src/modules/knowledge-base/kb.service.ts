import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const kbService = {
  async list(filters: any, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (userCompanyId) {
      where.OR = [{ companyId: userCompanyId }, { isPublic: true }]
    } else if (filters.companyId) {
      where.companyId = filters.companyId
    }
    if (filters.category) where.category = filters.category
    if (filters.search) where.title = { contains: filters.search, mode: 'insensitive' }

    const [data, total] = await Promise.all([
      prisma.knowledgeBase.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.knowledgeBase.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string) {
    const article = await prisma.knowledgeBase.findUnique({ where: { id } })
    if (!article) throw new NotFoundError('Article')
    return article
  },

  async create(data: any) {
    return prisma.knowledgeBase.create({ data })
  },

  async update(id: string, data: any) {
    await this.getById(id)
    return prisma.knowledgeBase.update({ where: { id }, data })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.knowledgeBase.delete({ where: { id } })
  },
}
