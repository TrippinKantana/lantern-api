import type { Request, Response } from 'express'
import { invoicesService } from './invoices.service.js'

export const invoicesController = {
  async list(req: Request, res: Response) {
    const result = await invoicesService.list(req.query, req.user!.companyId)
    res.json({ status: 'success', ...result })
  },

  async getById(req: Request, res: Response) {
    const isClient = Boolean(req.user!.companyId)
    const invoice = isClient
      ? await invoicesService.getById(String(req.params.id), req.user!.companyId)
      : await invoicesService.getByIdForStaff(String(req.params.id), null)
    res.json({ status: 'success', data: invoice })
  },

  async create(req: Request, res: Response) {
    const invoice = await invoicesService.create(req.body)
    res.status(201).json({ status: 'success', data: invoice })
  },

  async update(req: Request, res: Response) {
    const invoice = await invoicesService.update(String(req.params.id), req.body, req.user!.companyId)
    res.json({ status: 'success', data: invoice })
  },

  async delete(req: Request, res: Response) {
    await invoicesService.delete(String(req.params.id), req.user!.companyId)
    res.json({ status: 'success', data: null })
  },

  /**
   * Send invoice to client.
   * - { markOnly: true } → status SENT only (no email)
   * - otherwise emails PDF (pdfBase64 optional) to company contacts / client users
   */
  async send(req: Request, res: Response) {
    if (req.body?.markOnly === true) {
      const invoice = await invoicesService.markSent(String(req.params.id), req.user!.companyId)
      res.json({ status: 'success', data: invoice })
      return
    }

    const result = await invoicesService.sendEmail(String(req.params.id), req.user!.companyId, {
      email: req.body?.email,
      message: req.body?.message,
      pdfBase64: req.body?.pdfBase64,
    })
    res.json({
      status: 'success',
      data: result.invoice,
      email: result.email,
    })
  },
}
