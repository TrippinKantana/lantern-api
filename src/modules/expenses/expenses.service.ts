import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

export const expensesService = {
  async list(filters: any) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (filters.category) where.category = filters.category
    if (filters.status) where.status = filters.status
    if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.taxCategory) where.taxCategory = filters.taxCategory
    if (filters.startDate && filters.endDate) {
      where.date = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) }
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          bankAccount: { select: { id: true, name: true, bankName: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        bankAccount: { select: { id: true, name: true, bankName: true } },
        project: { select: { id: true, name: true } },
      },
    })
    if (!expense) throw new NotFoundError('Expense')
    return expense
  },

  async create(data: any, submittedById: string) {
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        subcategory: data.subcategory,
        vendor: data.vendor,
        description: data.description,
        amount: data.amount,
        currency: data.currency || 'USD',
        date: new Date(data.date),
        bankAccountId: data.bankAccountId || undefined,
        projectId: data.projectId || undefined,
        receiptKey: data.receiptKey,
        receiptName: data.receiptName,
        isTaxDeductible: data.isTaxDeductible ?? true,
        taxCategory: data.taxCategory,
        notes: data.notes,
        submittedById,
      },
    })

    // If linked to a bank account, create a debit transaction and update balance
    if (data.bankAccountId) {
      await prisma.transaction.create({
        data: {
          bankAccountId: data.bankAccountId,
          type: 'debit',
          amount: data.amount,
          currency: data.currency || 'USD',
          description: `Expense: ${data.description}`,
          expenseId: expense.id,
          date: new Date(data.date),
        },
      })
      await prisma.bankAccount.update({
        where: { id: data.bankAccountId },
        data: { balance: { decrement: data.amount } },
      })
    }

    return expense
  },

  async update(id: string, data: any) {
    await this.getById(id)
    const updateData: any = { ...data }
    if (data.date) updateData.date = new Date(data.date)
    return prisma.expense.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.expense.delete({ where: { id } })
  },

  async getSummary(filters: any = {}) {
    const where: any = {}
    if (filters.startDate && filters.endDate) {
      where.date = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) }
    }

    const total = await prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true })

    // By category
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    })

    // By tax category
    const byTaxCategory = await prisma.expense.groupBy({
      by: ['taxCategory'],
      where: { ...where, isTaxDeductible: true },
      _sum: { amount: true },
      _count: true,
    })

    // By month (current year)
    const yearStart = new Date(new Date().getFullYear(), 0, 1)
    const monthlyExpenses = await prisma.expense.findMany({
      where: { date: { gte: yearStart } },
      select: { amount: true, date: true },
    })

    const byMonth: Record<string, number> = {}
    for (const e of monthlyExpenses) {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`
      byMonth[key] = (byMonth[key] || 0) + Number(e.amount)
    }

    return {
      totalAmount: Number(total._sum.amount || 0),
      totalCount: total._count,
      byCategory: byCategory.map((c) => ({ category: c.category, amount: Number(c._sum.amount || 0), count: c._count })),
      byTaxCategory: byTaxCategory.map((c) => ({ taxCategory: c.taxCategory, amount: Number(c._sum.amount || 0), count: c._count })),
      byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)),
    }
  },
}
