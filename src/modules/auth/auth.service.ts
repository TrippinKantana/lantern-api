import { prisma } from '../../config/database.js'
import { comparePassword, hashPassword } from '../../shared/utils/password.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, type TokenPayload } from '../../shared/utils/jwt.js'
import { UnauthorizedError, NotFoundError, ConflictError } from '../../shared/utils/errors.js'
import { v4 as uuidv4 } from 'uuid'
import type { LoginInput, AcceptInviteInput } from './auth.schema.js'

export class AuthService {
  async login(input: LoginInput, meta: { userAgent?: string; ipAddress?: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid email or password')

    const valid = await comparePassword(input.password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Invalid email or password')

    const tokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    }

    const accessToken = signAccessToken(tokenPayload)
    const refreshToken = signRefreshToken({ sub: user.id })

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        avatar: user.avatar,
      },
    }
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string }
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new UnauthorizedError('Invalid refresh token')
    }

    const session = await prisma.session.findUnique({ where: { refreshToken } })
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } })
      throw new UnauthorizedError('Session expired')
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or inactive')

    const tokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    }

    const newAccessToken = signAccessToken(tokenPayload)
    const newRefreshToken = signRefreshToken({ sub: user.id })

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({ where: { refreshToken } })
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        avatar: true,
        phone: true,
        mfaEnabled: true,
        company: { select: { id: true, name: true, slug: true, logo: true } },
      },
    })
    if (!user) throw new NotFoundError('User')
    return user
  }

  async acceptInvite(input: AcceptInviteInput) {
    const invite = await prisma.invite.findUnique({ where: { token: input.token } })
    if (!invite) throw new NotFoundError('Invite')
    if (invite.status !== 'PENDING') throw new ConflictError('Invite already used')
    if (invite.expiresAt < new Date()) {
      await prisma.invite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } })
      throw new UnauthorizedError('Invite has expired')
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } })
    if (existing) throw new ConflictError('User already exists')

    const passwordHash = await hashPassword(input.password)

    const user = await prisma.user.create({
      data: {
        email: invite.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: invite.role,
        companyId: invite.companyId,
      },
    })

    await prisma.invite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } })

    return { id: user.id, email: user.email, role: user.role }
  }
}

export const authService = new AuthService()
