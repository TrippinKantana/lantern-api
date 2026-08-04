import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'
import { sendMail } from '../../shared/utils/mail.js'

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: `LNT-${year}-` } },
    orderBy: { invoiceNumber: 'desc' },
  })
  const seq = last ? parseInt(last.invoiceNumber.split('-')[2]!) + 1 : 1
  return `LNT-${year}-${String(seq).padStart(4, '0')}`
}

const invoiceInclude = {
  company: { select: { id: true, name: true, address: true, phone: true, domain: true } },
  project: { select: { id: true, name: true } },
  lineItems: true,
  payments: { orderBy: { createdAt: 'desc' as const } },
}

async function resolveRecipientEmails(companyId: string, overrideEmail?: string): Promise<string[]> {
  if (overrideEmail?.trim()) return [overrideEmail.trim()]

  const [contacts, users] = await Promise.all([
    prisma.companyContact.findMany({
      where: { companyId },
      select: { email: true, isPrimary: true },
      orderBy: { isPrimary: 'desc' },
    }),
    prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        role: { in: ['CLIENT_ADMIN', 'CLIENT_USER'] },
      },
      select: { email: true },
    }),
  ])

  const emails = new Set<string>()
  for (const c of contacts) {
    if (c.email) emails.add(c.email.toLowerCase())
  }
  for (const u of users) {
    if (u.email) emails.add(u.email.toLowerCase())
  }
  return [...emails]
}

export const invoicesService = {
  async list(filters: any, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (userCompanyId) {
      where.companyId = userCompanyId
      // Clients only see invoices that have been issued (not drafts)
      if (!filters.status) {
        where.status = { in: ['SENT', 'PAID', 'OVERDUE', 'REFUNDED'] }
      }
    } else if (filters.companyId) {
      where.companyId = filters.companyId
    }
    if (filters.status) where.status = filters.status

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          lineItems: true,
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string, userCompanyId: string | null) {
    const where: any = { id }
    if (userCompanyId) {
      where.companyId = userCompanyId
      where.status = { not: 'DRAFT' }
    }

    const invoice = await prisma.invoice.findFirst({
      where,
      include: invoiceInclude,
    })
    if (!invoice) throw new NotFoundError('Invoice')
    return this._reconcileStatus(invoice)
  },

  async create(data: {
    companyId: string
    projectId?: string
    dueDate: string
    issueDate?: string
    currency?: string
    notes?: string
    tax?: number
    lineItems: { description: string; quantity: number; unitPrice: number }[]
  }) {
    if (!data.companyId) throw new ValidationError('Company is required')
    if (!data.dueDate) throw new ValidationError('Due date is required')
    if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
      throw new ValidationError('At least one line item is required')
    }

    const company = await prisma.company.findUnique({ where: { id: data.companyId } })
    if (!company) throw new ValidationError('Company not found')

    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, companyId: data.companyId },
      })
      if (!project) throw new ValidationError('Project not found for this company')
    }

    const invoiceNumber = await generateInvoiceNumber()
    const lineItems = data.lineItems.map((item) => {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      if (!item.description?.trim()) throw new ValidationError('Line item description is required')
      return {
        description: item.description.trim(),
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      }
    })
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const tax = Number(data.tax) || 0
    const total = subtotal + tax

    return prisma.invoice.create({
      data: {
        companyId: data.companyId,
        projectId: data.projectId || null,
        invoiceNumber,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        total,
        currency: data.currency || 'USD',
        notes: data.notes,
        lineItems: { create: lineItems },
      },
      include: {
        lineItems: true,
        company: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })
  },

  async update(id: string, data: any, userCompanyId: string | null) {
    await this.getByIdForStaff(id, userCompanyId)

    const updateData: any = {}
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate)
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.status) updateData.status = data.status
    if (data.paidAt) updateData.paidAt = new Date(data.paidAt)
    if (data.currency) updateData.currency = data.currency
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null

    if (data.lineItems && Array.isArray(data.lineItems)) {
      if (data.lineItems.length === 0) throw new ValidationError('At least one line item is required')
      const lineItems = data.lineItems.map((item: any) => {
        const quantity = Number(item.quantity) || 0
        const unitPrice = Number(item.unitPrice) || 0
        return {
          description: item.description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        }
      })
      const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0)
      const tax = data.tax ?? 0
      const total = subtotal + Number(tax)

      await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } })

      return prisma.invoice.update({
        where: { id },
        data: {
          ...updateData,
          subtotal,
          tax,
          total,
          lineItems: { create: lineItems },
        },
        include: invoiceInclude,
      })
    }

    return prisma.invoice.update({
      where: { id },
      data: updateData,
      include: invoiceInclude,
    })
  },

  /** Permanently deletes an invoice regardless of status (draft, sent, paid, etc). */
  async delete(id: string, userCompanyId: string | null) {
    await this.getByIdForStaff(id, userCompanyId)
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.delete({ where: { id } }),
    ])
  },

  /** Staff/admin can view drafts; clients cannot. */
  async getByIdForStaff(id: string, userCompanyId: string | null) {
    const where: any = { id }
    if (userCompanyId) where.companyId = userCompanyId

    const invoice = await prisma.invoice.findFirst({
      where,
      include: invoiceInclude,
    })
    if (!invoice) throw new NotFoundError('Invoice')
    return this._reconcileStatus(invoice)
  },

  /** Records a payment against an invoice and marks it PAID only once fully covered. */
  async recordPayment(
    id: string,
    userCompanyId: string | null,
    data: { amount: number; method: string; externalId?: string; paidAt?: string },
  ) {
    const invoice = await this.getByIdForStaff(id, userCompanyId)
    const amount = Number(data.amount)
    if (!amount || amount <= 0) throw new ValidationError('Payment amount must be greater than zero')
    if (!data.method?.trim()) throw new ValidationError('Payment method is required')

    const paidAt = data.paidAt ? new Date(data.paidAt) : new Date()

    await prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        currency: invoice.currency,
        method: data.method,
        externalId: data.externalId || undefined,
        status: 'completed',
        paidAt,
      },
    })

    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId: id, status: 'completed' },
      _sum: { amount: true },
    })
    const paidSoFar = Number(totalPaid._sum.amount || 0)
    const isFullyPaid = paidSoFar >= Number(invoice.total) - 0.005

    // Status must always reflect what's actually been recorded — including
    // correcting an invoice that was previously (incorrectly) marked PAID
    // for less than its full total.
    const nextStatus = isFullyPaid ? 'PAID' : invoice.status === 'PAID' ? 'SENT' : invoice.status

    return prisma.invoice.update({
      where: { id },
      data: { status: nextStatus, paidAt: isFullyPaid ? paidAt : null },
      include: invoiceInclude,
    })
  },

  /** Deletes a recorded payment and re-derives the invoice status from what remains. */
  async deletePayment(id: string, paymentId: string, userCompanyId: string | null) {
    const invoice = await this.getByIdForStaff(id, userCompanyId)
    const payment = invoice.payments?.find((p: any) => p.id === paymentId)
    if (!payment) throw new NotFoundError('Payment')

    await prisma.payment.delete({ where: { id: paymentId } })

    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId: id, status: 'completed' },
      _sum: { amount: true },
    })
    const paidSoFar = Number(totalPaid._sum.amount || 0)
    const isFullyPaid = paidSoFar >= Number(invoice.total) - 0.005
    const nextStatus = isFullyPaid ? 'PAID' : invoice.status === 'PAID' ? 'SENT' : invoice.status

    return prisma.invoice.update({
      where: { id },
      data: { status: nextStatus, paidAt: isFullyPaid ? payment.paidAt : null },
      include: invoiceInclude,
    })
  },

  /** Self-heals an invoice stuck as PAID with recorded payments that don't actually cover the total. */
  async _reconcileStatus(invoice: any) {
    if (invoice.status !== 'PAID' || !invoice.payments?.length) return invoice
    const paid = invoice.payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    if (paid >= Number(invoice.total) - 0.005) return invoice
    return prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'SENT', paidAt: null },
      include: invoiceInclude,
    })
  },

  async markSent(id: string, userCompanyId: string | null) {
    const invoice = await this.getByIdForStaff(id, userCompanyId)
    return prisma.invoice.update({
      where: { id },
      data: {
        status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
        issueDate: invoice.status === 'DRAFT' ? new Date() : invoice.issueDate,
      },
      include: invoiceInclude,
    })
  },

  async sendEmail(
    id: string,
    userCompanyId: string | null,
    options: { email?: string; message?: string; pdfBase64?: string } = {},
  ) {
    const invoice = await this.getByIdForStaff(id, userCompanyId)
    const recipients = await resolveRecipientEmails(invoice.companyId, options.email)

    if (recipients.length === 0) {
      throw new ValidationError(
        'No client email found. Add a company contact or client user, or enter an email address.',
      )
    }

    // Mark as sent when emailing a draft
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: invoice.status === 'DRAFT' || invoice.status === 'SENT' ? 'SENT' : invoice.status,
        issueDate: invoice.status === 'DRAFT' ? new Date() : invoice.issueDate,
      },
      include: invoiceInclude,
    })

    const portalNote =
      'If you have access to the Lantern Client Portal, you can also view and download this invoice there.'
    const customMessage = options.message?.trim()
    const text = [
      `Hello,`,
      ``,
      `Please find invoice ${updated.invoiceNumber} from Lantern Inc.`,
      ``,
      `Amount due: ${updated.currency} ${Number(updated.total).toFixed(2)}`,
      `Due date: ${new Date(updated.dueDate).toLocaleDateString()}`,
      customMessage ? `` : null,
      customMessage || null,
      ``,
      portalNote,
      ``,
      `Regards,`,
      `Lantern Inc.`,
      `info@lanternsystems.com`,
    ]
      .filter((line) => line !== null)
      .join('\n')

    const attachments = options.pdfBase64
      ? [
          {
            filename: `${updated.invoiceNumber}.pdf`,
            content: options.pdfBase64.replace(/^data:application\/pdf;base64,/, ''),
            encoding: 'base64' as const,
            contentType: 'application/pdf',
          },
        ]
      : undefined

    const mailResult = await sendMail({
      to: recipients,
      subject: `Invoice ${updated.invoiceNumber} from Lantern Inc.`,
      text,
      attachments,
    })

    return {
      invoice: updated,
      email: {
        sent: mailResult.sent,
        recipients,
        reason: mailResult.reason,
      },
    }
  },
}
