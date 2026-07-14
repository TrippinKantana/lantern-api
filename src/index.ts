import { createServer } from 'http'
import { config } from './config/index.js'
import { app } from './app.js'
import { prisma } from './config/database.js'
import { LANTERN_DEPARTMENTS } from './shared/constants/departments.js'
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from './shared/constants/permissions.js'
import { hashPassword } from './shared/utils/password.js'
import type { UserRole } from './generated/prisma/client.js'

const server = createServer(app)

async function seedDepartments() {
  for (const dept of LANTERN_DEPARTMENTS) {
    const existing = await prisma.department.findUnique({ where: { name: dept.name } })
    if (!existing) {
      await prisma.department.create({ data: dept })
    }
  }
}

/** Keep role default permissions in sync so new grants (e.g. staff invoice create) apply without a full reseed. */
async function ensureRolePermissions() {
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      create: perm,
      update: { description: perm.description },
    })
  }

  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    for (const { resource, action } of perms) {
      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      })
      if (!permission) continue
      await prisma.roleDefaultPermission.upsert({
        where: { role_permissionId: { role: role as UserRole, permissionId: permission.id } },
        create: { role: role as UserRole, permissionId: permission.id },
        update: {},
      })
    }
  }
}

async function ensureAdminUser() {
  const existing = await prisma.user.findUnique({ where: { email: config.admin.email } })

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: config.admin.firstName,
        lastName: config.admin.lastName,
        role: 'SUPER_ADMIN',
        isActive: true,
        passwordHash: await hashPassword(config.admin.password),
      },
    })
    return
  }

  await prisma.user.create({
    data: {
      email: config.admin.email,
      passwordHash: await hashPassword(config.admin.password),
      firstName: config.admin.firstName,
      lastName: config.admin.lastName,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
}

async function main() {
  await prisma.$connect()
  console.log('Database connected')

  await seedDepartments().catch((err) => console.error('Department seed failed:', err))
  await ensureRolePermissions().catch((err) => console.error('Permission sync failed:', err))
  await ensureAdminUser().catch((err) => console.error('Admin seed failed:', err))

  server.listen(config.port, () => {
    console.log(`Lantern API running on http://localhost:${config.port}`)
    console.log(`Environment: ${config.nodeEnv}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  server.close()
})
