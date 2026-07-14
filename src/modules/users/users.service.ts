import { prisma } from '../../config/database.js'
import { hashPassword } from '../../shared/utils/password.js'
import { ConflictError, NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'
import { v4 as uuidv4 } from 'uuid'
import { randomBytes } from 'crypto'
import type { CreateUserInput, UpdateUserInput, InviteUserInput } from './users.schema.js'
import type { UserRole } from '../../generated/prisma/client.js'

const userListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  companyId: true,
  isActive: true,
  avatar: true,
  phone: true,
  lastLoginAt: true,
  createdAt: true,
  employeeId: true,
  jobTitle: true,
  employmentType: true,
  departmentId: true,
  startDate: true,
  endDate: true,
  company: { select: { id: true, name: true, slug: true } },
  department: { select: { id: true, name: true, color: true } },
} as const

function generateTemporaryPassword(length = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = randomBytes(length)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += alphabet[bytes[i]! % alphabet.length]
  }
  return password
}

export class UsersService {
  async list(query: { page?: string; limit?: string; companyId?: string; role?: string }) {
    const { page, limit } = parsePagination(query)
    const where: Record<string, unknown> = {}
    if (query.companyId) where.companyId = query.companyId
    if (query.role) where.role = query.role as UserRole

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: userListSelect,
      }),
      prisma.user.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userListSelect,
        mfaEnabled: true,
        updatedAt: true,
        address: true,
        city: true,
        country: true,
        postalCode: true,
      },
    })
    if (!user) throw new NotFoundError('User')
    return user
  }

  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new ConflictError('User with this email already exists')

    const shouldGenerate = input.generatePassword !== false && (!input.password || input.password.length === 0)
    const plainPassword = shouldGenerate ? generateTemporaryPassword() : input.password!
    if (!plainPassword || plainPassword.length < 8) {
      throw new ConflictError('Password must be at least 8 characters')
    }

    const passwordHash = await hashPassword(plainPassword)
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role as UserRole,
        companyId: input.companyId || null,
        phone: input.phone,
        jobTitle: input.jobTitle || null,
        departmentId: input.departmentId || null,
        employmentType: input.employmentType || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        address: input.address || null,
        city: input.city || null,
        country: input.country || null,
        postalCode: input.postalCode || null,
      },
      select: userListSelect,
    })

    return {
      ...user,
      ...(shouldGenerate ? { temporaryPassword: plainPassword } : {}),
    }
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundError('User')

    return prisma.user.update({
      where: { id },
      data: {
        ...input,
        role: input.role as UserRole | undefined,
      },
      select: userListSelect,
    })
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundError('User')
    await prisma.user.delete({ where: { id } })
  }

  /** Generate (or regenerate) login credentials for a staff member. Returns password once. */
  async generateCredentials(id: string) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundError('User')

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await hashPassword(temporaryPassword)

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      temporaryPassword,
    }
  }

  async invite(input: InviteUserInput, invitedBy: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new ConflictError('User with this email already exists')

    const pendingInvite = await prisma.invite.findFirst({
      where: { email: input.email, status: 'PENDING' },
    })
    if (pendingInvite) throw new ConflictError('An invite for this email is already pending')

    // Client roles require a company
    if ((input.role === 'CLIENT_ADMIN' || input.role === 'CLIENT_USER') && !input.companyId) {
      throw new ConflictError('Company is required when inviting client users')
    }

    // Lantern staff should be created via staff onboarding, not invite — but allow SUPER path if needed
    const invite = await prisma.invite.create({
      data: {
        email: input.email,
        role: input.role as UserRole,
        companyId: input.companyId || null,
        token: uuidv4(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedBy,
      },
    })

    return { id: invite.id, email: invite.email, token: invite.token, expiresAt: invite.expiresAt }
  }
}

export const usersService = new UsersService()
