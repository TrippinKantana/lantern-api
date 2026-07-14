import { createServer } from 'http'
import { config } from './config/index.js'
import { app } from './app.js'
import { prisma } from './config/database.js'
import { ensureBootstrapped } from './bootstrap.js'

const isVercel = Boolean(process.env.VERCEL)

// Local / traditional Node hosting
if (!isVercel) {
  const server = createServer(app)
  ensureBootstrapped()
    .then(() => {
      server.listen(config.port, () => {
        console.log(`Lantern API running on http://localhost:${config.port}`)
        console.log(`Environment: ${config.nodeEnv}`)
      })
    })
    .catch((err) => {
      console.error('Failed to start server:', err)
      process.exit(1)
    })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    server.close()
  })
}

// Vercel serverless: export the Express app as the request handler.
// Use module.exports (not export default alone) so @vercel/node resolves the app.
module.exports = app
