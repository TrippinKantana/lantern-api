import nodemailer from 'nodemailer'
import { config } from '../../config/index.js'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter
  if (!config.smtp.host) return null

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
  })
  return transporter
}

export interface SendMailOptions {
  to: string | string[]
  subject: string
  text: string
  html?: string
  attachments?: {
    filename: string
    content: Buffer | string
    contentType?: string
    encoding?: string
  }[]
}

export async function sendMail(options: SendMailOptions): Promise<{ sent: boolean; reason?: string }> {
  const transport = getTransporter()
  if (!transport) {
    console.warn('[mail] SMTP not configured — email not sent:', options.subject)
    return { sent: false, reason: 'SMTP is not configured on the server' }
  }

  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to
  if (!to) return { sent: false, reason: 'No recipients' }

  await transport.sendMail({
    from: config.smtp.from,
    to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text.replace(/\n/g, '<br/>'),
    attachments: options.attachments,
  })

  return { sent: true }
}

export function isMailConfigured() {
  return Boolean(config.smtp.host)
}
