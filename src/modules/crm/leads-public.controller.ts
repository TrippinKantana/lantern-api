import type { Request, Response } from 'express'
import { prisma } from '../../config/database.js'

export const leadsPublicController = {
  async submit(req: Request, res: Response) {
    const {
      fullName, organization, role, email, phone,
      service, orgType, requirements, message,
      sourcePage, serviceInterest,
    } = req.body

    if (!fullName || !email) {
      res.status(400).json({ status: 'error', message: 'Name and email are required' })
      return
    }

    const lead = await prisma.lead.create({
      data: {
        contactName: fullName,
        contactEmail: email,
        contactPhone: phone || undefined,
        contactRole: role || undefined,
        companyName: organization || undefined,
        organizationType: orgType || undefined,
        source: 'website_form',
        sourcePage: sourcePage || undefined,
        serviceInterest: serviceInterest || service || undefined,
        temperature: 'warm',
        notes: requirements || message || undefined,
        requirements: requirements || message || undefined,
      },
    })

    // Create notification for all super admins and lantern staff
    const lanternUsers = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'LANTERN_STAFF'] }, isActive: true },
      select: { id: true },
    })

    await prisma.notification.createMany({
      data: lanternUsers.map((u) => ({
        userId: u.id,
        type: 'new_lead',
        title: 'New Lead Submission',
        body: `${fullName} from ${organization || 'Unknown'} is interested in ${serviceInterest || service || 'our services'}`,
        link: `/portal/crm/leads`,
      })),
    })

    // Auto-create first activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'form_submission',
        notes: `Submitted via ${sourcePage || 'website'} form. Service interest: ${serviceInterest || service || 'General'}. ${requirements ? `Requirements: ${requirements}` : ''}`,
      },
    })

    res.status(201).json({ status: 'success', message: 'Thank you. We will be in touch shortly.' })
  },
}
