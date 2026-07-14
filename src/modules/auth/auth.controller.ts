import type { Request, Response } from 'express'
import { authService } from './auth.service.js'

export class AuthController {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    res.json({
      status: 'success',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    })
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies.refreshToken
    if (!token) {
      res.status(401).json({ status: 'error', message: 'No refresh token' })
      return
    }

    const result = await authService.refresh(token)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    res.json({
      status: 'success',
      data: { accessToken: result.accessToken },
    })
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies.refreshToken
    if (token) await authService.logout(token)

    res.clearCookie('refreshToken', { path: '/api/v1/auth' })
    res.json({ status: 'success', data: null })
  }

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id)
    res.json({ status: 'success', data: user })
  }

  async acceptInvite(req: Request, res: Response) {
    const result = await authService.acceptInvite(req.body)
    res.status(201).json({ status: 'success', data: result })
  }
}

export const authController = new AuthController()
