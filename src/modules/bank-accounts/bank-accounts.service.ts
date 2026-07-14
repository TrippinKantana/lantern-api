import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'

export const bankAccountsService = {
  async list() {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { expenses: true, transactions: true } } },
    })
    return accounts
  },

  async getById(id: string) {
    const account = await prisma.bankAccount.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { date: 'desc' }, take: 50 },
        _count: { select: { expenses: true, transactions: true } },
      },
    })
    if (!account) throw new NotFoundError('Bank account')
    return account
  },

  async create(data: { name: string; bankName: string; accountNumber?: string; bsb?: string; swift?: string; currency?: string; accountType?: string; notes?: string }) {
    return prisma.bankAccount.create({ data })
  },

  async update(id: string, data: any) {
    await this.getById(id)
    return prisma.bankAccount.update({ where: { id }, data })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.bankAccount.delete({ where: { id } })
  },

  async addFunds(id: string, data: { amount: number; description: string; reference?: string; invoiceId?: string; date?: string }) {
    const account = await this.getById(id)

    await prisma.transaction.create({
      data: {
        bankAccountId: id,
        type: 'credit',
        amount: data.amount,
        currency: account.currency,
        description: data.description,
        reference: data.reference,
        invoiceId: data.invoiceId,
        date: data.date ? new Date(data.date) : new Date(),
      },
    })

    return prisma.bankAccount.update({
      where: { id },
      data: { balance: { increment: data.amount } },
    })
  },

  async getSummary() {
    const accounts = await prisma.bankAccount.findMany({ where: { isActive: true } })
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const monthlyExpenses = await prisma.expense.aggregate({
      where: { date: { gte: thisMonth } },
      _sum: { amount: true },
    })

    const monthlyIncome = await prisma.transaction.aggregate({
      where: { type: 'credit', date: { gte: thisMonth } },
      _sum: { amount: true },
    })

    return {
      totalBalance,
      accountCount: accounts.length,
      monthlyExpenses: Number(monthlyExpenses._sum.amount || 0),
      monthlyIncome: Number(monthlyIncome._sum.amount || 0),
    }
  },
}
