import { prisma } from '../../config/database.js'
import type { TicketPriority, TicketStatus } from '../../generated/prisma/client.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
}

function computeSlaDeadline(priority: TicketPriority): Date {
  const hours = SLA_HOURS[priority] || 24
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export const ticketsService = {
  async list(filters: any, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}

    if (userCompanyId) where.companyId = userCompanyId
    else if (filters.companyId) where.companyId = filters.companyId

    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.assigneeId) where.assigneeId = filters.assigneeId
    if (filters.category) where.category = filters.category

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { comments: true, files: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string, userCompanyId: string | null) {
    const where: any = { id }
    if (userCompanyId) where.companyId = userCompanyId

    const ticket = await prisma.ticket.findFirst({
      where,
      include: {
        company: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        comments: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        files: true,
      },
    })
    if (!ticket) throw new NotFoundError('Ticket')
    return ticket
  },

  async create(data: {
    companyId: string
    subject: string
    description: string
    priority?: TicketPriority
    category?: string
  }, createdById: string) {
    const priority = data.priority || 'MEDIUM'
    return prisma.ticket.create({
      data: {
        companyId: data.companyId,
        subject: data.subject,
        description: data.description,
        priority,
        category: data.category,
        createdById,
        slaDeadline: computeSlaDeadline(priority),
      },
      include: {
        company: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  },

  async update(id: string, data: any, userCompanyId: string | null) {
    const existing = await this.getById(id, userCompanyId)
    const updateData: any = { ...data }

    if (data.status === 'RESOLVED' && existing.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }
    if (data.status === 'CLOSED' && existing.status !== 'CLOSED') {
      updateData.closedAt = new Date()
    }
    if (data.priority && data.priority !== existing.priority) {
      updateData.slaDeadline = computeSlaDeadline(data.priority)
    }

    return prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  },

  async addComment(ticketId: string, userId: string, content: string, isInternal: boolean = false, userCompanyId: string | null) {
    await this.getById(ticketId, userCompanyId)
    return prisma.comment.create({
      data: { ticketId, userId, content, isInternal },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    })
  },
}
