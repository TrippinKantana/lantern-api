import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const goalsService = {
  async list(filters: any) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.companyId) where.companyId = filters.companyId

    const [data, total] = await Promise.all([
      prisma.goal.findMany({
        where, orderBy: { endDate: 'asc' }, skip: (page - 1) * limit, take: limit,
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.goal.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string) {
    const goal = await prisma.goal.findUnique({ where: { id }, include: { company: { select: { id: true, name: true } } } })
    if (!goal) throw new NotFoundError('Goal')
    return goal
  },

  async create(data: any) {
    return prisma.goal.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit || 'USD',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        companyId: data.companyId,
      },
    })
  },

  async update(id: string, data: any) {
    await this.getById(id)
    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    if (data.currentValue !== undefined && data.targetValue) {
      updateData.status = Number(data.currentValue) >= Number(data.targetValue) ? 'completed' : 'active'
    }
    return prisma.goal.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.goal.delete({ where: { id } })
  },
}
