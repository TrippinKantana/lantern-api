import { prisma } from '../../config/database.js'
import type { TaskStatus, TaskPriority } from '../../generated/prisma/client.js'
import { NotFoundError, AppError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

const VALID_TRANSITIONS: Record<string, string[]> = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED', 'TODO'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS'],
  BLOCKED: ['TODO', 'IN_PROGRESS'],
  DONE: ['IN_PROGRESS'],
}

export const tasksService = {
  async list(filters: any, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}

    if (filters.projectId) where.projectId = filters.projectId
    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.assigneeId) where.assigneeId = filters.assigneeId
    if (filters.milestoneId) where.milestoneId = filters.milestoneId

    if (userCompanyId) {
      where.project = { companyId: userCompanyId }
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          project: { select: { id: true, name: true } },
          milestone: { select: { id: true, name: true } },
          _count: { select: { comments: true, subtasks: true, timeEntries: true } },
        },
        orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true, companyId: true } },
        milestone: { select: { id: true, name: true } },
        subtasks: { include: { assignee: { select: { id: true, firstName: true, lastName: true } } } },
        comments: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        dependencies: { include: { dependency: { select: { id: true, title: true, status: true } } } },
        _count: { select: { timeEntries: true } },
      },
    })
    if (!task) throw new NotFoundError('Task')
    return task
  },

  async create(data: {
    projectId: string
    title: string
    description?: string
    priority?: TaskPriority
    assigneeId?: string
    milestoneId?: string
    dueDate?: string
    estimatedHours?: number
    parentTaskId?: string
  }, createdById: string) {
    const count = await prisma.task.count({ where: { projectId: data.projectId } })
    return prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId,
        milestoneId: data.milestoneId,
        parentTaskId: data.parentTaskId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        estimatedHours: data.estimatedHours,
        createdById,
        sortOrder: count,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
      },
    })
  },

  async update(id: string, data: any) {
    const existing = await this.getById(id)

    if (data.status && data.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status]
      if (allowed && !allowed.includes(data.status)) {
        throw new AppError(400, `Cannot transition from ${existing.status} to ${data.status}`)
      }
    }

    const updateData: any = { ...data }
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)

    return prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
      },
    })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.task.delete({ where: { id } })
  },

  async addComment(taskId: string, userId: string, content: string, isInternal: boolean = false) {
    await this.getById(taskId)
    return prisma.comment.create({
      data: { taskId, userId, content, isInternal },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    })
  },
}
