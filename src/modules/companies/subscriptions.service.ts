import { prisma } from '../../config/database.js'
import { ALL_SERVICES } from '../../shared/constants/services.js'

export const subscriptionsService = {
  async getCatalog() {
    return ALL_SERVICES
  },

  async listForCompany(companyId: string) {
    return prisma.companySubscription.findMany({
      where: { companyId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
  },

  async add(companyId: string, data: { category: string; name: string; isCustom?: boolean; status?: string; startDate?: string; endDate?: string; notes?: string }) {
    return prisma.companySubscription.create({
      data: {
        companyId,
        category: data.category,
        name: data.name,
        isCustom: data.isCustom || false,
        status: data.status || 'active',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        notes: data.notes,
      },
    })
  },

  async addMultiple(companyId: string, items: { category: string; name: string }[]) {
    const results = []
    for (const item of items) {
      const existing = await prisma.companySubscription.findUnique({
        where: { companyId_category_name: { companyId, category: item.category, name: item.name } },
      })
      if (!existing) {
        const sub = await prisma.companySubscription.create({
          data: { companyId, category: item.category, name: item.name, startDate: new Date() },
        })
        results.push(sub)
      } else {
        results.push(existing)
      }
    }
    return results
  },

  async update(id: string, data: { status?: string; endDate?: string; notes?: string }) {
    const updateData: any = { ...data }
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    return prisma.companySubscription.update({ where: { id }, data: updateData })
  },

  async remove(id: string) {
    return prisma.companySubscription.delete({ where: { id } })
  },
}
