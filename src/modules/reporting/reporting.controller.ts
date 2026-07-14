import type { Request, Response } from 'express'
import { reportingService } from './reporting.service.js'

export const reportingController = {
  async dashboard(req: Request, res: Response) {
    const data = await reportingService.dashboard(req.user!.companyId)
    res.json({ status: 'success', data })
  },
  async revenue(req: Request, res: Response) {
    const data = await reportingService.revenueReport(req.query)
    res.json({ status: 'success', data })
  },
  async expenses(req: Request, res: Response) {
    const data = await reportingService.expenseReport(req.query)
    res.json({ status: 'success', data })
  },
  async projectStats(req: Request, res: Response) {
    const data = await reportingService.projectStats(req.query)
    res.json({ status: 'success', data })
  },
  async ticketStats(req: Request, res: Response) {
    const data = await reportingService.ticketStats(req.query)
    res.json({ status: 'success', data })
  },
  async timeReport(req: Request, res: Response) {
    const data = await reportingService.timeReport(req.query)
    res.json({ status: 'success', data })
  },
  async crmReport(req: Request, res: Response) {
    const data = await reportingService.crmReport()
    res.json({ status: 'success', data })
  },
}
