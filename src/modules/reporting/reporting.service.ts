import { prisma } from '../../config/database.js'

function dateFilter(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return {}
  return { gte: new Date(startDate), lte: new Date(endDate) }
}

export const reportingService = {
  async dashboard(userCompanyId: string | null) {
    const cf = userCompanyId ? { companyId: userCompanyId } : {}

    const [totalProjects, activeProjects, completedProjects, totalTickets, openTickets, resolvedTickets, totalInvoices, paidInvoices, pendingInvoices, overdueInvoices, totalUsers, totalCompanies] = await Promise.all([
      prisma.project.count({ where: cf }), prisma.project.count({ where: { ...cf, status: 'ACTIVE' } }), prisma.project.count({ where: { ...cf, status: 'COMPLETED' } }),
      prisma.ticket.count({ where: cf }), prisma.ticket.count({ where: { ...cf, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } }), prisma.ticket.count({ where: { ...cf, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.invoice.count({ where: cf }), prisma.invoice.count({ where: { ...cf, status: 'PAID' } }), prisma.invoice.count({ where: { ...cf, status: { in: ['DRAFT', 'SENT'] } } }), prisma.invoice.count({ where: { ...cf, status: 'OVERDUE' } }),
      prisma.user.count({ where: userCompanyId ? { companyId: userCompanyId } : {} }), prisma.company.count(),
    ])

    const rev = await prisma.invoice.aggregate({ where: { ...cf, status: 'PAID' }, _sum: { total: true } })
    const pendRev = await prisma.invoice.aggregate({ where: { ...cf, status: { in: ['SENT', 'OVERDUE'] } }, _sum: { total: true } })

    return {
      projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
      tickets: { total: totalTickets, open: openTickets, resolved: resolvedTickets },
      invoices: { total: totalInvoices, paid: paidInvoices, pending: pendingInvoices, overdue: overdueInvoices },
      users: { total: totalUsers }, companies: { total: totalCompanies },
      revenue: { paid: Number(rev._sum.total || 0), pending: Number(pendRev._sum.total || 0) },
    }
  },

  async revenueReport(filters: any) {
    const dateWhere = filters.startDate && filters.endDate ? { issueDate: dateFilter(filters.startDate, filters.endDate) } : {}

    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID', ...dateWhere },
      include: { company: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
      orderBy: { paidAt: 'desc' },
    })

    const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total), 0)

    // By company
    const byCompany: Record<string, { name: string; amount: number; count: number }> = {}
    for (const inv of paidInvoices) {
      const name = inv.company?.name || 'Internal'
      if (!byCompany[name]) byCompany[name] = { name, amount: 0, count: 0 }
      byCompany[name]!.amount += Number(inv.total)
      byCompany[name]!.count++
    }

    // By month
    const byMonth: Record<string, number> = {}
    for (const inv of paidInvoices) {
      const d = inv.paidAt || inv.issueDate
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      byMonth[key] = (byMonth[key] || 0) + Number(inv.total)
    }

    return {
      totalRevenue,
      invoiceCount: paidInvoices.length,
      invoices: paidInvoices,
      byCompany: Object.values(byCompany).sort((a, b) => b.amount - a.amount),
      byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)),
    }
  },

  async expenseReport(filters: any) {
    const dateWhere = filters.startDate && filters.endDate ? { date: dateFilter(filters.startDate, filters.endDate) } : {}

    const expenses = await prisma.expense.findMany({
      where: dateWhere,
      include: { bankAccount: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { date: 'desc' },
    })

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const taxDeductible = expenses.filter((e) => e.isTaxDeductible).reduce((s, e) => s + Number(e.amount), 0)

    const byCategory: Record<string, { category: string; amount: number; count: number }> = {}
    for (const e of expenses) {
      if (!byCategory[e.category]) byCategory[e.category] = { category: e.category, amount: 0, count: 0 }
      byCategory[e.category]!.amount += Number(e.amount)
      byCategory[e.category]!.count++
    }

    const byTaxCategory: Record<string, number> = {}
    for (const e of expenses.filter((e) => e.isTaxDeductible && e.taxCategory)) {
      byTaxCategory[e.taxCategory!] = (byTaxCategory[e.taxCategory!] || 0) + Number(e.amount)
    }

    const byMonth: Record<string, number> = {}
    for (const e of expenses) {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`
      byMonth[key] = (byMonth[key] || 0) + Number(e.amount)
    }

    return {
      totalExpenses, taxDeductible, nonDeductible: totalExpenses - taxDeductible,
      expenseCount: expenses.length, expenses,
      byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
      byTaxCategory: Object.entries(byTaxCategory).map(([cat, amount]) => ({ category: cat, amount })).sort((a, b) => b.amount - a.amount),
      byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)),
    }
  },

  async projectStats(filters: any) {
    const projects = await prisma.project.findMany({
      include: { company: { select: { name: true } }, _count: { select: { tasks: true, milestones: true, timeEntries: true } } },
      orderBy: { updatedAt: 'desc' },
    })

    const byStatus = await prisma.project.groupBy({ by: ['status'], _count: { _all: true } })

    const tasks = await prisma.task.findMany({ select: { status: true, projectId: true } })
    const tasksByStatus = await prisma.task.groupBy({ by: ['status'], _count: { _all: true } })

    return {
      projects,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      tasksByStatus: tasksByStatus.map((s) => ({ status: s.status, count: s._count._all })),
      totalProjects: projects.length,
      totalTasks: tasks.length,
    }
  },

  async ticketStats(filters: any) {
    const dateWhere = filters.startDate && filters.endDate ? { createdAt: dateFilter(filters.startDate, filters.endDate) } : {}

    const byStatus = await prisma.ticket.groupBy({ by: ['status'], where: dateWhere, _count: { _all: true } })
    const byPriority = await prisma.ticket.groupBy({ by: ['priority'], where: dateWhere, _count: { _all: true } })

    const byCompany = await prisma.ticket.groupBy({
      by: ['companyId'], where: dateWhere, _count: { _all: true },
    })
    const companies = await prisma.company.findMany({ where: { id: { in: byCompany.map((c) => c.companyId) } }, select: { id: true, name: true } })

    const resolved = await prisma.ticket.findMany({
      where: { ...dateWhere, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 200, orderBy: { resolvedAt: 'desc' },
    })

    let avgResolutionHours = 0
    if (resolved.length > 0) {
      avgResolutionHours = Math.round(resolved.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 3600000, 0) / resolved.length * 10) / 10
    }

    const totalTickets = byStatus.reduce((s, x) => s + x._count._all, 0)

    return {
      totalTickets, avgResolutionHours,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count._all })),
      byCompany: byCompany.map((c) => ({ companyId: c.companyId, companyName: companies.find((co) => co.id === c.companyId)?.name || 'Unknown', count: c._count._all })).sort((a, b) => b.count - a.count),
    }
  },

  async timeReport(filters: any) {
    const dateWhere = filters.startDate && filters.endDate ? { startTime: dateFilter(filters.startDate, filters.endDate) } : {}

    const entries = await prisma.timeEntry.findMany({
      where: dateWhere,
      include: { user: { select: { id: true, firstName: true, lastName: true } }, project: { select: { id: true, name: true } } },
      orderBy: { startTime: 'desc' },
    })

    const totalMinutes = entries.reduce((s, e) => s + (e.duration || 0), 0)
    const billableMinutes = entries.filter((e) => e.billable).reduce((s, e) => s + (e.duration || 0), 0)

    // By user
    const byUser: Record<string, { name: string; totalMinutes: number; billableMinutes: number }> = {}
    for (const e of entries) {
      const name = e.user ? `${e.user.firstName} ${e.user.lastName}` : 'Unknown'
      if (!byUser[name]) byUser[name] = { name, totalMinutes: 0, billableMinutes: 0 }
      byUser[name]!.totalMinutes += e.duration || 0
      if (e.billable) byUser[name]!.billableMinutes += e.duration || 0
    }

    // By project
    const byProject: Record<string, { name: string; totalMinutes: number }> = {}
    for (const e of entries) {
      const name = e.project?.name || 'No project'
      if (!byProject[name]) byProject[name] = { name, totalMinutes: 0 }
      byProject[name]!.totalMinutes += e.duration || 0
    }

    return {
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      billableHours: Math.round(billableMinutes / 60 * 10) / 10,
      entryCount: entries.length,
      byUser: Object.values(byUser).sort((a, b) => b.totalMinutes - a.totalMinutes),
      byProject: Object.values(byProject).sort((a, b) => b.totalMinutes - a.totalMinutes),
    }
  },

  async crmReport() {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
    const byStatus = await prisma.lead.groupBy({ by: ['status'], _count: { _all: true } })
    const bySource = await prisma.lead.groupBy({ by: ['source'], _count: { _all: true } })
    const byTemp = await prisma.lead.groupBy({ by: ['temperature'], _count: { _all: true } })

    const totalValue = leads.reduce((s, l) => s + Number(l.value || 0), 0)
    const wonValue = leads.filter((l) => l.status === 'WON').reduce((s, l) => s + Number(l.value || 0), 0)

    return {
      totalLeads: leads.length, totalValue, wonValue,
      conversionRate: leads.length > 0 ? Math.round(leads.filter((l) => l.status === 'WON').length / leads.length * 100) : 0,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      bySource: bySource.map((s) => ({ source: s.source || 'Unknown', count: s._count._all })),
      byTemperature: byTemp.map((t) => ({ temperature: t.temperature, count: t._count._all })),
    }
  },
}
