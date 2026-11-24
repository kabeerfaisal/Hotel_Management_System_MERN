import nodemailer from 'nodemailer'

const DEFAULT_FROM = 'LuxuryStay Hospitality <noreply@luxurystay.com>'

let transporter

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587)

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  return transporter
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('A recipient email address is required')
  if (!isEmailConfigured()) {
    throw new Error('SMTP credentials are not configured')
  }

  return getTransporter().sendMail({
    from: process.env.SMTP_FROM || DEFAULT_FROM,
    to,
    subject,
    html,
    text,
  })
}

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  )
}
