import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../shared/utils/errors.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      status: 'error',
      message: err.message,
    }
    if ('errors' in err && Array.isArray((err as any).errors)) {
      body.errors = (err as any).errors
    }
    res.status(err.statusCode).json(body)
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  })
}
