import { prisma } from '../../config/database.js'
import type { LeadStatus } from '../../generated/prisma/client.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

const STAGE_ORDER: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST']

export const crmService = {
  async listLeads(filters: any) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.assignedToId) where.assignedToId = filters.assignedToId
    if (filters.search) {
      where.OR = [
        { contactName: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          _count: { select: { proposals: true, activities: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ])

    return paginatedResponse(data, total, { page, limit })
  },

  async getLeadById(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        proposals: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
    if (!lead) throw new NotFoundError('Lead')
    return lead
  },

  async createLead(data: any) {
    return prisma.lead.create({ data })
  },

  async updateLead(id: string, data: any) {
    await this.getLeadById(id)
    return prisma.lead.update({ where: { id }, data })
  },

  async deleteLead(id: string) {
    await this.getLeadById(id)
    return prisma.lead.delete({ where: { id } })
  },

  async addActivity(leadId: string, data: { type: string; notes?: string }) {
    await this.getLeadById(leadId)
    return prisma.leadActivity.create({
      data: { leadId, type: data.type, notes: data.notes },
    })
  },

  async convertToCompany(leadId: string) {
    const lead = await this.getLeadById(leadId)

    if (lead.status !== 'WON') {
      // Auto-mark as won
      await prisma.lead.update({ where: { id: leadId }, data: { status: 'WON' } })
    }

    // Check if already converted
    if (lead.companyId) {
      const existing = await prisma.company.findUnique({ where: { id: lead.companyId } })
      if (existing) return { company: existing, lead, alreadyConverted: true }
    }

    // Generate slug from company name
    const baseName = lead.companyName || lead.contactName
    const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check slug uniqueness
    let finalSlug = slug
    let counter = 1
    while (await prisma.company.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Create the company
    const company = await prisma.company.create({
      data: {
        name: lead.companyName || lead.contactName,
        slug: finalSlug,
        industry: lead.organizationType || undefined,
        phone: lead.contactPhone || undefined,
      },
    })

    // Create the primary contact from the lead's contact person
    await prisma.companyContact.create({
      data: {
        companyId: company.id,
        name: lead.contactName,
        email: lead.contactEmail,
        phone: lead.contactPhone || undefined,
        role: lead.contactRole || undefined,
        isPrimary: true,
        notes: `Converted from lead. Service interest: ${lead.serviceInterest || 'General'}`,
      },
    })

    // Link the lead to the company
    await prisma.lead.update({
      where: { id: leadId },
      data: { companyId: company.id, status: 'WON' },
    })

    // Log the conversion
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'converted',
        notes: `Lead converted to company: ${company.name} (${company.slug})`,
      },
    })

    // Create first user invite record (optional — admin can send invite later)
    // For now, just create the company. The admin onboards users manually.

    return { company, lead, alreadyConverted: false }
  },

  async getPipelineSummary() {
    const stages = await Promise.all(
      STAGE_ORDER.map(async (status) => {
        const leads = await prisma.lead.findMany({
          where: { status },
          select: { id: true, contactName: true, companyName: true, value: true, currency: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        })
        const totalValue = leads.reduce((sum, l) => sum + Number(l.value || 0), 0)
        return { status, count: leads.length, totalValue, leads }
      }),
    )
    return stages
  },
}
