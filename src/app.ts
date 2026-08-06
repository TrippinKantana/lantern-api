import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config } from './config/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { ensureBootstrapped } from './bootstrap.js'

import { authRoutes } from './modules/auth/auth.routes.js'
import { userRoutes } from './modules/users/users.routes.js'
import { companyRoutes } from './modules/companies/companies.routes.js'
import { projectRoutes } from './modules/projects/projects.routes.js'
import { taskRoutes } from './modules/tasks/tasks.routes.js'
import { ticketRoutes } from './modules/tickets/tickets.routes.js'
import { messagingRoutes } from './modules/messaging/messaging.routes.js'
import { crmRoutes } from './modules/crm/crm.routes.js'
import { invoiceRoutes } from './modules/invoices/invoices.routes.js'
import { contractRoutes } from './modules/contracts/contracts.routes.js'
import { timeRoutes } from './modules/time-tracking/time.routes.js'
import { kbRoutes } from './modules/knowledge-base/kb.routes.js'
import { announcementRoutes } from './modules/announcements/announcements.routes.js'
import { calendarRoutes } from './modules/calendar/calendar.routes.js'
import { goalRoutes } from './modules/goals/goals.routes.js'
import { notificationRoutes } from './modules/notifications/notifications.routes.js'
import { reportingRoutes } from './modules/reporting/reporting.routes.js'
import { auditLogRoutes } from './modules/audit-logs/audit-logs.routes.js'
import { fileRoutes } from './modules/files/files.routes.js'
import { careersRoutes } from './modules/careers/careers.routes.js'

const app = express()

// Parse comma-separated CORS_ORIGIN env var and trim whitespace
const allowedOrigins = (config.cors.origin || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    // Allow any vercel.app preview or wearelantern.net subdomain
    if (
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.wearelantern.net') ||
      origin === 'https://wearelantern.net'
    ) {
      return callback(null, true)
    }
    return callback(new Error(`CORS: ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Health stays free of DB bootstrap so deploys can be probed even if DB is warming
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Connect DB (and light seeds) before authenticated / data routes
app.use(async (_req, _res, next) => {
  try {
    await ensureBootstrapped()
    next()
  } catch (err) {
    next(err)
  }
})

// Public lead submission (no auth)
import { leadsPublicController } from './modules/crm/leads-public.controller.js'
app.post('/api/v1/leads/submit', (req, res, next) => { leadsPublicController.submit(req, res).catch(next) })

// Public careers listing + applications (no auth)
import multer from 'multer'
import { careersPublicController } from './modules/careers/careers-public.controller.js'
const resumeUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
app.get('/api/v1/careers/jobs', (req, res, next) => { careersPublicController.list(req, res).catch(next) })
app.get('/api/v1/careers/jobs/:slug', (req, res, next) => { careersPublicController.getBySlug(req, res).catch(next) })
app.post('/api/v1/careers/jobs/:id/apply', resumeUpload.single('resume'), (req, res, next) => { careersPublicController.apply(req, res).catch(next) })

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/companies', companyRoutes)
app.use('/api/v1/projects', projectRoutes)
app.use('/api/v1/tasks', taskRoutes)
app.use('/api/v1/tickets', ticketRoutes)
app.use('/api/v1/messaging', messagingRoutes)
app.use('/api/v1/crm', crmRoutes)
app.use('/api/v1/invoices', invoiceRoutes)
app.use('/api/v1/contracts', contractRoutes)
app.use('/api/v1/time-entries', timeRoutes)
app.use('/api/v1/knowledge-base', kbRoutes)
app.use('/api/v1/announcements', announcementRoutes)
app.use('/api/v1/calendar', calendarRoutes)
app.use('/api/v1/goals', goalRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/reports', reportingRoutes)
app.use('/api/v1/audit-logs', auditLogRoutes)
app.use('/api/v1/files', fileRoutes)
app.use('/api/v1/jobs', careersRoutes)

import { bankAccountRoutes } from './modules/bank-accounts/bank-accounts.routes.js'
import { expenseRoutes } from './modules/expenses/expenses.routes.js'
import { departmentRoutes } from './modules/departments/departments.routes.js'
import { employeeRoutes } from './modules/employees/employees.routes.js'
app.use('/api/v1/bank-accounts', bankAccountRoutes)
app.use('/api/v1/expenses', expenseRoutes)
app.use('/api/v1/departments', departmentRoutes)
app.use('/api/v1/employees', employeeRoutes)

app.use(errorHandler)

export { app }
