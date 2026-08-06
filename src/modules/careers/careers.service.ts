import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination.js'

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function uniqueSlug(title: string) {
  const base = slugify(title) || 'position'
  let slug = base
  let suffix = 1
  while (await prisma.jobPosting.findUnique({ where: { slug } })) {
    suffix += 1
    slug = `${base}-${suffix}`
  }
  return slug
}

export const careersService = {
  // ── Admin ──
  async list(filters: any) {
    const { page, limit } = parsePagination(filters)
    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.department) where.department = filters.department

    const [data, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { _count: { select: { applications: true } } },
      }),
      prisma.jobPosting.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getById(id: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    })
    if (!job) throw new NotFoundError('Job posting')
    return job
  },

  async create(data: any, createdById?: string) {
    const slug = await uniqueSlug(data.title)
    return prisma.jobPosting.create({
      data: {
        title: data.title,
        slug,
        department: data.department,
        location: data.location,
        locationType: data.locationType || 'REMOTE',
        employmentType: data.employmentType || 'FULL_TIME',
        summary: data.summary,
        aboutLantern: data.aboutLantern,
        opportunity: data.opportunity,
        responsibilities: data.responsibilities,
        requirements: data.requirements,
        preferredQualifications: data.preferredQualifications,
        whatYoullGain: data.whatYoullGain,
        probationEmployment: data.probationEmployment,
        whyJoinLantern: data.whyJoinLantern,
        howToApply: data.howToApply,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency || 'USD',
        status: data.status || 'DRAFT',
        publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined,
        closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
        createdById,
      },
    })
  },

  async update(id: string, data: any) {
    const existing = await this.getById(id)
    const updateData: any = { ...data }
    if (data.closesAt) updateData.closesAt = new Date(data.closesAt)
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') updateData.publishedAt = new Date()
    return prisma.jobPosting.update({ where: { id }, data: updateData })
  },

  async delete(id: string) {
    await this.getById(id)
    return prisma.jobPosting.delete({ where: { id } })
  },

  async listApplications(jobPostingId: string, filters: any) {
    await this.getById(jobPostingId)
    const { page, limit } = parsePagination(filters)
    const where: any = { jobPostingId }
    if (filters.status) where.status = filters.status

    const [data, total] = await Promise.all([
      prisma.jobApplication.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.jobApplication.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getApplicationById(id: string) {
    const application = await prisma.jobApplication.findUnique({ where: { id }, include: { jobPosting: { select: { id: true, title: true, slug: true } } } })
    if (!application) throw new NotFoundError('Application')
    return application
  },

  async updateApplication(id: string, data: any) {
    await this.getApplicationById(id)
    return prisma.jobApplication.update({ where: { id }, data })
  },

  // ── Public ──
  async listPublished(filters: any) {
    const { page, limit } = parsePagination(filters)
    const where: any = {
      status: 'PUBLISHED',
      OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
    }
    if (filters.department) where.department = filters.department
    if (filters.locationType) where.locationType = filters.locationType

    const [data, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        select: {
          id: true, title: true, slug: true, department: true, location: true, locationType: true,
          employmentType: true, summary: true, salaryMin: true, salaryMax: true, salaryCurrency: true,
          publishedAt: true, closesAt: true,
        },
      }),
      prisma.jobPosting.count({ where }),
    ])
    return paginatedResponse(data, total, { page, limit })
  },

  async getPublishedBySlug(slug: string) {
    const job = await prisma.jobPosting.findFirst({
      where: { slug, status: 'PUBLISHED', OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }] },
    })
    if (!job) throw new NotFoundError('Job posting')
    return job
  },

  async apply(jobPostingId: string, data: any, resume?: { key: string; name: string }) {
    const job = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } })
    if (!job || job.status !== 'PUBLISHED') throw new NotFoundError('Job posting')

    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        coverNote: data.coverNote || undefined,
        resumeKey: resume?.key,
        resumeName: resume?.name,
      },
    })

    const lanternUsers = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'LANTERN_STAFF'] }, isActive: true },
      select: { id: true },
    })
    await prisma.notification.createMany({
      data: lanternUsers.map((u) => ({
        userId: u.id,
        type: 'new_job_application',
        title: 'New Job Application',
        body: `${data.fullName} applied for ${job.title}`,
        link: `/portal/admin/jobs/${job.id}`,
      })),
    })

    return application
  },
}
