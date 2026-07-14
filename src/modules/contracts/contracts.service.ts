import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const contractsService = {
  async list(filters: any, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (userCompanyId) where.companyId = userCompanyId
    else if (filters.companyId) where.companyId = filters.companyId
    if (filters.status) where.status = filters.status
    if (filters.type) where.type = filters.type

    const [data, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: { company: { select: { id: true, name: true } }, _count: { select: { files: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string, userCompanyId: string | null) {
    const where: any = { id }
    if (userCompanyId) where.companyId = userCompanyId
    const contract = await prisma.contract.findFirst({
      where,
      include: { company: { select: { id: true, name: true } }, files: true },
    })
    if (!contract) throw new NotFoundError('Contract')
    return contract
  },

  async create(data: any) {
    return prisma.contract.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        type: data.type,
        content: data.content,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : undefined,
        autoRenew: data.autoRenew || false,
      },
      include: { company: { select: { id: true, name: true } } },
    })
  },

  async update(id: string, data: any, userCompanyId: string | null) {
    await this.getById(id, userCompanyId)
    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.renewalDate) updateData.renewalDate = new Date(data.renewalDate)
    return prisma.contract.update({ where: { id }, data: updateData })
  },
}
