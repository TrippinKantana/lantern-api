import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const filesService = {
  async list(filters: any, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (userCompanyId) where.companyId = userCompanyId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.ticketId) where.ticketId = filters.ticketId
    if (filters.contractId) where.contractId = filters.contractId

    const [data, total] = await Promise.all([
      prisma.fileAsset.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.fileAsset.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string) {
    const file = await prisma.fileAsset.findUnique({ where: { id } })
    if (!file) throw new NotFoundError('File')
    return file
  },

  async create(data: {
    name: string; originalName: string; mimeType: string; size: number;
    storageKey: string; uploadedById: string;
    companyId?: string; projectId?: string; ticketId?: string; contractId?: string; messageId?: string;
  }) {
    return prisma.fileAsset.create({ data })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.fileAsset.delete({ where: { id } })
  },
}
