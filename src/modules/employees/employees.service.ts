import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/errors.js'

function generateEmployeeId(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `LNT-${year}-${seq}`
}

function generateBarcode(employeeId: string): string {
  // Code 128 barcode as SVG data URI
  const chars = employeeId.split('')
  const barWidth = 2
  const height = 60
  const padding = 10
  let x = padding
  const bars: string[] = []

  // Simple encoding: each character generates a pattern of bars
  for (const char of chars) {
    const code = char.charCodeAt(0)
    const pattern = code.toString(2).padStart(8, '0')
    for (const bit of pattern) {
      if (bit === '1') {
        bars.push(`<rect x="${x}" y="${padding}" width="${barWidth}" height="${height}" fill="#000"/>`)
      }
      x += barWidth
    }
    x += barWidth // gap between chars
  }

  const totalWidth = x + padding
  const totalHeight = height + padding * 2 + 20

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
    <rect width="${totalWidth}" height="${totalHeight}" fill="#fff"/>
    ${bars.join('')}
    <text x="${totalWidth / 2}" y="${height + padding + 16}" text-anchor="middle" font-family="monospace" font-size="12" fill="#000">${employeeId}</text>
  </svg>`

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export const employeesService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { select: { id: true, name: true, slug: true } },
        department: true,
        assignedTasks: {
          where: { status: { not: 'DONE' } },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        timeEntries: {
          orderBy: { startTime: 'desc' },
          take: 5,
          include: { project: { select: { id: true, name: true } } },
        },
        employeeContracts: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!user) throw new NotFoundError('User')

    // Get projects this user is involved in
    const projects = await prisma.project.findMany({
      where: { tasks: { some: { assigneeId: userId } } },
      select: { id: true, name: true, status: true, company: { select: { name: true } } },
      distinct: ['id'],
    })

    return { ...user, projects, passwordHash: undefined, mfaSecret: undefined }
  },

  async updateProfile(userId: string, data: any) {
    await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    const updateData: any = {}

    const stringFields = ['firstName', 'lastName', 'phone', 'jobTitle', 'employmentType', 'nationality', 'address', 'city', 'country', 'postalCode', 'personalEmail', 'personalPhone', 'bio', 'nextOfKinName', 'nextOfKinRelation', 'nextOfKinPhone', 'nextOfKinEmail']
    for (const field of stringFields) {
      if (field in data) updateData[field] = data[field] || null
    }

    const dateFields = ['dateOfBirth', 'startDate', 'endDate']
    for (const field of dateFields) {
      if (field in data) updateData[field] = data[field] ? new Date(data[field]) : null
    }

    if ('departmentId' in data) updateData.departmentId = data.departmentId || null

    return prisma.user.update({ where: { id: userId }, data: updateData })
  },

  async generateEmployeeIdAndBarcode(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User')

    let empId = user.employeeId
    if (!empId) {
      empId = generateEmployeeId()
    }

    const barcode = generateBarcode(empId)

    return prisma.user.update({
      where: { id: userId },
      data: { employeeId: empId, idCardBarcode: barcode },
    })
  },

  async getIdCard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, employeeId: true, idCardBarcode: true, jobTitle: true, department: { select: { name: true } }, avatar: true },
    })
    if (!user) throw new NotFoundError('User')
    if (!user.employeeId) throw new NotFoundError('Employee ID not generated')
    return user
  },

  // Employee contracts
  async listContracts(userId: string) {
    return prisma.employeeContract.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async createContract(userId: string, data: { title: string; type: string; content?: string; startDate?: string; endDate?: string }) {
    return prisma.employeeContract.create({
      data: {
        userId,
        title: data.title,
        type: data.type,
        content: data.content,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })
  },

  async updateContract(contractId: string, data: any) {
    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    return prisma.employeeContract.update({ where: { id: contractId }, data: updateData })
  },
}
