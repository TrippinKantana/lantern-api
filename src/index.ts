import { createServer } from 'http'
import { config } from './config/index.js'
import { app } from './app.js'
import { prisma } from './config/database.js'
import { LANTERN_DEPARTMENTS } from './shared/constants/departments.js'
import { hashPassword } from './shared/utils/password.js'

const server = createServer(app)

async function seedDepartments() {
  for (const dept of LANTERN_DEPARTMENTS) {
    const existing = await prisma.department.findUnique({ where: { name: dept.name } })
    if (!existing) {
      await prisma.department.create({ data: dept })
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
