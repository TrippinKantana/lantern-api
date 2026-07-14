import { prisma } from '../../config/database.js'
import type { ProjectStatus } from '../../generated/prisma/client.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

interface ProjectFilters {
  companyId?: string
  status?: string
  search?: string
  page?: string
  limit?: string
}

export const projectsService = {
  async list(filters: ProjectFilters, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}

    if (userCompanyId) where.companyId = userCompanyId
    else if (filters.companyId) where.companyId = filters.companyId

    if (filters.status) where.status = filters.status
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' }
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          _count: { select: { tasks: true, milestones: true, timeEntries: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string, userCompanyId: string | null) {
    const where: any = { id }
    if (userCompanyId) where.companyId = userCompanyId

    const project = await prisma.project.findFirst({
      where,
      include: {
        company: { select: { id: true, name: true, slug: true } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { tasks: true, comments: true, files: true, timeEntries: true } },
      },
    })
    if (!project) throw new NotFoundError('Project')
    return project
  },

  async create(data: {
    companyId?: string
    name: string
    description?: string
    status?: ProjectStatus
    startDate?: string
    endDate?: string
    budget?: number
    currency?: string
  }) {
    return prisma.project.create({
      data: {
        companyId: data.companyId || null,
        name: data.name,
        description: data.description,
        status: data.status || 'DRAFT',
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        budget: data.budget,
        currency: data.currency || 'USD',
      },
      include: {
        company: { select: { id: true, name: true, slug: true } },
      },
    })
  },

  async update(id: string, data: any, userCompanyId: string | null) {
    await this.getById(id, userCompanyId)
    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    return prisma.project.update({ where: { id }, data: updateData })
  },

  async delete(id: string, userCompanyId: string | null) {
    await this.getById(id, userCompanyId)
    return prisma.project.delete({ where: { id } })
  },

  async listMilestones(projectId: string, userCompanyId: string | null) {
    await this.getById(projectId, userCompanyId)
    return prisma.milestone.findMany({
      where: { projectId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { sortOrder: 'asc' },
    })
  },

  async createMilestone(projectId: string, data: { name: string; description?: string; dueDate?: string }, userCompanyId: string | null) {
    await this.getById(projectId, userCompanyId)
    const count = await prisma.milestone.count({ where: { projectId } })
    return prisma.milestone.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        sortOrder: count,
      },
    })
  },
}
