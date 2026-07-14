import { config } from './config/index.js'
import { prisma } from './config/database.js'
import { LANTERN_DEPARTMENTS } from './shared/constants/departments.js'
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from './shared/constants/permissions.js'
import { hashPassword } from './shared/utils/password.js'
import type { UserRole } from './generated/prisma/client.js'

async function seedDepartments() {
  for (const dept of LANTERN_DEPARTMENTS) {
    const existing = await prisma.department.findUnique({ where: { name: dept.name } })
    if (!existing) {
      await prisma.department.create({ data: dept })
    }
  }
}

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

let bootstrapPromise: Promise<void> | null = null

/**
 * One-time DB connect + light seeds.
 * Safe to call on every request; only the first run does work.
 * Permission sync runs in the background so login is not blocked.
 */
export function ensureBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await prisma.$connect()
      console.log('Database connected')
      await seedDepartments().catch((err) => console.error('Department seed failed:', err))
      await ensureAdminUser().catch((err) => console.error('Admin seed failed:', err))
      void ensureRolePermissions().catch((err) => console.error('Permission sync failed:', err))
    })().catch((err) => {
      bootstrapPromise = null
      throw err
    })
  }
  return bootstrapPromise
}
