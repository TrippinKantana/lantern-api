import { prisma } from '../../config/database.js'
import { ConflictError, NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'
import type { CreateCompanyInput, UpdateCompanyInput, AssignRepInput } from './companies.schema.js'

export class CompaniesService {
  async list(query: { page?: string; limit?: string; search?: string }) {
    const { page, limit } = parsePagination(query)
    const where: Record<string, unknown> = {}
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, projects: true, tickets: true } },
        },
      }),
      prisma.company.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  }

  async getById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, projects: true, tickets: true, invoices: true, contracts: true, subscriptions: true } },
        reps: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
        },
        contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
        subscriptions: { orderBy: [{ category: 'asc' }, { name: 'asc' }] },
      },
    })
    if (!company) throw new NotFoundError('Company')
    return company
  }

  async create(input: CreateCompanyInput) {
    const existing = await prisma.company.findUnique({ where: { slug: input.slug } })
    if (existing) throw new ConflictError('Company with this slug already exists')

    return prisma.company.create({ data: input })
  }

  async update(id: string, input: UpdateCompanyInput) {
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) throw new NotFoundError('Company')

    return prisma.company.update({ where: { id }, data: input })
  }

  async delete(id: string) {
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) throw new NotFoundError('Company')
    await prisma.company.delete({ where: { id } })
  }

  async assignRep(companyId: string, input: AssignRepInput) {
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundError('Company')

    return prisma.companyRep.upsert({
      where: { companyId_userId: { companyId, userId: input.userId } },
      create: { companyId, userId: input.userId, role: input.role, isPrimary: input.isPrimary },
      update: { role: input.role, isPrimary: input.isPrimary },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    })
  }

  async getUsers(companyId: string, query: { page?: string; limit?: string }) {
    const { page, limit } = parsePagination(query)
    const where = { companyId }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true,
          isActive: true, avatar: true, lastLoginAt: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  }

  // Contacts
  async addContact(companyId: string, data: { name: string; email: string; phone?: string; role?: string; isPrimary?: boolean; notes?: string }) {
    await this.getById(companyId)
    return prisma.companyContact.create({
      data: { companyId, ...data },
    })
  }

  async updateContact(contactId: string, data: any) {
    return prisma.companyContact.update({ where: { id: contactId }, data })
  }

  async deleteContact(contactId: string) {
    return prisma.companyContact.delete({ where: { id: contactId } })
  }
}

export const companiesService = new CompaniesService()
