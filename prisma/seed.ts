import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole } from '../src/generated/prisma/client.js'
import { hashPassword } from '../src/shared/utils/password.js'
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from '../src/shared/constants/permissions.js'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      create: perm,
      update: { description: perm.description },
    })
  }
  console.log(`Created ${ALL_PERMISSIONS.length} permissions`)

  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    for (const { resource, action } of perms) {
      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      })
      if (permission) {
        await prisma.roleDefaultPermission.upsert({
          where: { role_permissionId: { role: role as UserRole, permissionId: permission.id } },
          create: { role: role as UserRole, permissionId: permission.id },
          update: {},
        })
      }
    }
  }
  console.log('Assigned role default permissions')

  const adminEmail = 'admin@lanternsystems.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const passwordHash = await hashPassword('LanternAdmin2026!')
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Lantern',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
      },
    })
    console.log(`Created super admin: ${adminEmail} / LanternAdmin2026!`)
  } else {
    console.log('Super admin already exists')
  }

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
