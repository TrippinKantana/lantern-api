import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { hashPassword } from '../src/shared/utils/password.js'

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set')

  const sql = neon(connectionString)

  const adminEmail = process.env.ADMIN_EMAIL || 'cyrus@wearelantern.net'
  const adminPassword = process.env.ADMIN_PASSWORD || 'caTxLM9dtL2!'
  const adminFirst = process.env.ADMIN_FIRST_NAME || 'Cyrus'
  const adminLast = process.env.ADMIN_LAST_NAME || 'Lantern'

  console.log('Connected via Neon HTTP driver. Upserting admin user...')

  const passwordHash = await hashPassword(adminPassword)

  // Check if user exists
  const existing = await sql`SELECT id FROM "User" WHERE email = ${adminEmail} LIMIT 1`

  if (existing.length > 0) {
    await sql`
      UPDATE "User"
      SET
        "passwordHash" = ${passwordHash},
        "firstName"    = ${adminFirst},
        "lastName"     = ${adminLast},
        role           = 'SUPER_ADMIN',
        "isActive"     = true,
        "updatedAt"    = now()
      WHERE email = ${adminEmail}
    `
    console.log(`✓ Admin user updated: ${adminEmail}`)
  } else {
    // Generate a cuid-style id
    const id = 'cm' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
    await sql`
      INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
      VALUES (
        ${id},
        ${adminEmail},
        ${passwordHash},
        ${adminFirst},
        ${adminLast},
        'SUPER_ADMIN',
        true,
        now(),
        now()
      )
    `
    console.log(`✓ Admin user created: ${adminEmail}`)
  }

  console.log('Admin seed complete ✅')
  console.log(`  Email:    ${adminEmail}`)
  console.log(`  Password: ${adminPassword}`)
}

main().catch((e) => {
  console.error('Admin seed failed:', e)
  process.exit(1)
})
