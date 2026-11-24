import nodemailer from 'nodemailer'

const DEFAULT_FROM = 'LuxuryStay Hospitality <noreply@luxurystay.com>'
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

let transporter

function getFromAddress() {
  return process.env.SMTP_FROM || DEFAULT_FROM
}

/** Split a `Name <email>` From header into Brevo's sender object. */
function parseSender(value) {
  const match = String(value).match(/^\s*(.*?)\s*<([^>]+)>\s*$/)

  if (!match) {
    return { email: String(value).trim() }
  }

  const [, name, email] = match
  return name ? { name, email } : { email }
}

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
  return Boolean(process.env.BREVO_API_KEY) ||
    Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

async function sendViaBrevo({ to, subject, html, text }) {
  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: parseSender(getFromAddress()),
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
    }),
  })

  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    let detail = `HTTP ${response.status}`

    try {
      const payload = JSON.parse(raw)
      if (payload?.message) detail = `${detail}: ${payload.message}`
    } catch {
      if (raw) detail = `${detail}: ${raw.slice(0, 300)}`
    }

    throw new Error(detail)
  }

  return response.json().catch(() => ({}))
}

async function sendViaSmtp({ to, subject, html, text }) {
  return getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
  })
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('A recipient email address is required')

  if (!isEmailConfigured()) {
    const message =
      'No email provider is configured (set BREVO_API_KEY or SMTP_USER/SMTP_PASS)'
    console.error(`[Email] Failed to send to ${to}: ${message}`)
    throw new Error(message)
  }

  const provider = process.env.BREVO_API_KEY ? 'Brevo API' : 'SMTP'

  try {
    const info =
      provider === 'Brevo API'
        ? await sendViaBrevo({ to, subject, html, text })
        : await sendViaSmtp({ to, subject, html, text })

    console.log(`[Email] Sent to ${to} via ${provider}`)
    return info
  } catch (error) {
    console.error(
      `[Email] Failed to send to ${to} via ${provider}: ${error.message}`,
    )
    throw error
  }
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
