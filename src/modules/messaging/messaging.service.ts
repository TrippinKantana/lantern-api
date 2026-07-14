import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const messagingService = {
  async listChannels(userId: string) {
    return prisma.channel.findMany({
      where: { members: { some: { userId } } },
      include: {
        project: { select: { id: true, name: true } },
        members: { include: { }, select: { userId: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true, sender: { select: { firstName: true, lastName: true } } } },
        _count: { select: { messages: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async createChannel(data: { name: string; type: string; projectId?: string }, creatorId: string, memberIds: string[] = []) {
    const allMembers = [...new Set([creatorId, ...memberIds])]
    return prisma.channel.create({
      data: {
        name: data.name,
        type: data.type,
        projectId: data.projectId,
        members: { create: allMembers.map((userId) => ({ userId })) },
      },
      include: { _count: { select: { members: true } } },
    })
  },

  async getMessages(channelId: string, userId: string, filters: any) {
    const member = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    })
    if (!member) throw new NotFoundError('Channel')

    const { page, limit } = parsePagination(filters)
    const [data, total] = await Promise.all([
      prisma.message.findMany({
        where: { channelId },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where: { channelId } }),
    ])

    return paginatedResponse(data.reverse(), total, { page, limit })
  },

  async sendMessage(channelId: string, senderId: string, content: string, isInternal: boolean = false) {
    const member = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: senderId } },
    })
    if (!member) throw new NotFoundError('Channel')

    return prisma.message.create({
      data: { channelId, senderId, content, isInternal },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    })
  },
}
