import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'

export const calendarService = {
  async listEvents(filters: any, userId: string) {
    const where: any = {
      OR: [{ createdById: userId }, { attendees: { some: { userId } } }],
    }
    if (filters.startDate && filters.endDate) {
      where.startTime = { gte: new Date(filters.startDate) }
      where.endTime = { lte: new Date(filters.endDate) }
    }
    if (filters.type) where.type = filters.type

    return prisma.calendarEvent.findMany({
      where,
      include: {
        attendees: { select: { userId: true, status: true } },
      },
      orderBy: { startTime: 'asc' },
    })
  },

  async getById(id: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: { attendees: { select: { userId: true, status: true } } },
    })
    if (!event) throw new NotFoundError('Calendar event')
    return event
  },

  async create(data: any, createdById: string) {
    const attendeeIds: string[] = data.attendeeIds || []
    return prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        allDay: data.allDay || false,
        type: data.type || 'meeting',
        location: data.location,
        createdById,
        projectId: data.projectId,
        attendees: {
          create: [...new Set([createdById, ...attendeeIds])].map((uid) => ({
            userId: uid,
            status: uid === createdById ? 'accepted' : 'pending',
          })),
        },
      },
      include: { attendees: true },
    })
  },

  async update(id: string, data: any) {
    await this.getById(id)
    const updateData: any = { ...data }
    if (data.startTime) updateData.startTime = new Date(data.startTime)
    if (data.endTime) updateData.endTime = new Date(data.endTime)
    delete updateData.attendeeIds
    return prisma.calendarEvent.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.calendarEvent.delete({ where: { id } })
  },

  async rsvp(eventId: string, userId: string, status: string) {
    return prisma.calendarAttendee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status },
    })
  },
}
