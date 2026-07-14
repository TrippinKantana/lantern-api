import { prisma } from '../../config/database.js'
import { NotFoundError, AppError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const timeService = {
  async list(filters: any, userId: string) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (filters.userId) where.userId = filters.userId
    else where.userId = userId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.billable !== undefined) where.billable = filters.billable === 'true'
    if (filters.startDate && filters.endDate) {
      where.startTime = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) }
    }

    const [data, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.timeEntry.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async create(data: any, userId: string) {
    return prisma.timeEntry.create({
      data: {
        userId,
        projectId: data.projectId,
        taskId: data.taskId,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        duration: data.duration,
        billable: data.billable ?? true,
        hourlyRate: data.hourlyRate,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    })
  },

  async update(id: string, data: any, userId: string) {
    const entry = await prisma.timeEntry.findFirst({ where: { id, userId } })
    if (!entry) throw new NotFoundError('Time entry')
    const updateData: any = { ...data }
    if (data.startTime) updateData.startTime = new Date(data.startTime)
    if (data.endTime) updateData.endTime = new Date(data.endTime)
    return prisma.timeEntry.update({ where: { id }, data: updateData })
  },

  async stop(id: string, userId: string) {
    const entry = await prisma.timeEntry.findFirst({ where: { id, userId } })
    if (!entry) throw new NotFoundError('Time entry')
    if (entry.endTime) throw new AppError(400, 'Timer already stopped')
    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000)
    return prisma.timeEntry.update({
      where: { id },
      data: { endTime, duration },
    })
  },

  async delete(id: string, userId: string) {
    const entry = await prisma.timeEntry.findFirst({ where: { id, userId } })
    if (!entry) throw new NotFoundError('Time entry')
    return prisma.timeEntry.delete({ where: { id } })
  },

  async weekSummary(userId: string) {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    monday.setHours(0, 0, 0, 0)

    const entries = await prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: monday } },
      select: { duration: true, billable: true },
    })

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const billableMinutes = entries.filter((e) => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0)
    return { totalMinutes, billableMinutes, totalHours: Math.round(totalMinutes / 60 * 10) / 10, billableHours: Math.round(billableMinutes / 60 * 10) / 10 }
  },
}
