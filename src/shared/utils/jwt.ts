import jwt from 'jsonwebtoken'
import type { StringValue } from 'ms'
import { config } from '../../config/index.js'

export interface TokenPayload {
  sub: string
  email: string
  role: string
  companyId: string | null
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry as StringValue,
  })
}

export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign({ ...payload }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as StringValue,
  })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { sub: string }
}
