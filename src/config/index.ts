import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@lanternsystems.com',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || '/tmp/uploads',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'cyrus@wearelantern.net',
    password: process.env.ADMIN_PASSWORD || 'caTxLM9dtL2!',
    firstName: process.env.ADMIN_FIRST_NAME || 'Cyrus',
    lastName: process.env.ADMIN_LAST_NAME || 'Lantern',
  },
} as const
