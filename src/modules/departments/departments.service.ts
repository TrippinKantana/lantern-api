import { prisma } from '../../config/database.js'
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js'

export const departmentsService = {
  async list() {
    return prisma.department.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    })
  },

  async getById(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true, jobTitle: true, employmentType: true, isActive: true, employeeId: true },
          orderBy: { firstName: 'asc' },
        },
        _count: { select: { members: true } },
      },
    })
    if (!dept) throw new NotFoundError('Department')
    return dept
  },

  async create(data: { name: string; description?: string; color?: string }) {
    const existing = await prisma.department.findUnique({ where: { name: data.name } })
    if (existing) throw new ConflictError('Department with this name already exists')
    return prisma.department.create({ data })
  },

  async update(id: string, data: { name?: string; description?: string; headId?: string; color?: string }) {
    await this.getById(id)
    return prisma.department.update({ where: { id }, data })
  },

  async delete(id: string) {
    await this.getById(id)
    await prisma.user.updateMany({ where: { departmentId: id }, data: { departmentId: null } })
    return prisma.department.delete({ where: { id } })
  },
}
