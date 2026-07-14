import { prisma } from '../../config/database.js'
import type { InvoiceStatus } from '../../generated/prisma/client.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: `LNT-${year}-` } },
    orderBy: { invoiceNumber: 'desc' },
  })
  const seq = last ? parseInt(last.invoiceNumber.split('-')[2]!) + 1 : 1
  return `LNT-${year}-${String(seq).padStart(4, '0')}`
}

export const invoicesService = {
  async list(filters: any, userCompanyId: string | null) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (userCompanyId) where.companyId = userCompanyId
    else if (filters.companyId) where.companyId = filters.companyId
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
    if (userCompanyId) where.companyId = userCompanyId

    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        company: { select: { id: true, name: true, address: true, phone: true } },
        project: { select: { id: true, name: true } },
        lineItems: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!invoice) throw new NotFoundError('Invoice')
    return invoice
  },

  async create(data: {
    companyId: string
    projectId?: string
    dueDate: string
    currency?: string
    notes?: string
    lineItems: { description: string; quantity: number; unitPrice: number }[]
  }) {
    const invoiceNumber = await generateInvoiceNumber()
    const lineItems = data.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }))
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const tax = 0
    const total = subtotal + tax

    return prisma.invoice.create({
      data: {
        companyId: data.companyId,
        projectId: data.projectId,
        invoiceNumber,
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        total,
        currency: data.currency || 'USD',
        notes: data.notes,
        lineItems: { create: lineItems },
      },
      include: { lineItems: true, company: { select: { id: true, name: true } } },
    })
  },

  async update(id: string, data: any, userCompanyId: string | null) {
    await this.getById(id, userCompanyId)

    const updateData: any = {}
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.status) updateData.status = data.status
    if (data.paidAt) updateData.paidAt = new Date(data.paidAt)

    if (data.lineItems && Array.isArray(data.lineItems)) {
      const lineItems = data.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }))
      const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0)
      const tax = data.tax ?? 0
      const total = subtotal + tax

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
        include: { lineItems: true, company: { select: { id: true, name: true } } },
      })
    }

    return prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { lineItems: true, company: { select: { id: true, name: true } } },
    })
  },

  async markSent(id: string, userCompanyId: string | null) {
    await this.getById(id, userCompanyId)
    return prisma.invoice.update({
      where: { id },
      data: { status: 'SENT', issueDate: new Date() },
    })
  },
}
