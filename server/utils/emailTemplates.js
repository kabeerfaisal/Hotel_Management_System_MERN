const HEADER = `
  <tr>
    <td style="padding:28px 32px;background:#171a21;color:#f7f3e8;">
      <div style="font-size:20px;letter-spacing:2px;font-weight:bold;">LUXURYSTAY</div>
      <div style="margin-top:6px;font-size:11px;letter-spacing:3px;color:#d8b45a;">HOSPITALITY</div>
    </td>
  </tr>
`

const FOOTER = `
  <tr>
    <td style="padding:18px 32px;background:#f6f3ec;font-size:11px;color:#8a8175;">
      LuxuryStay Hospitality · Clifton, Karachi
    </td>
  </tr>
`

/**
 * Shared branded canvas used by every lifecycle email.
 * Callers are responsible for escaping any user-supplied values they pass in.
 */
export function emailShell({ heading, intro, content }) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;color:#2c2925;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e6dfd2;border-radius:16px;overflow:hidden;">
        ${HEADER}
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:23px;color:#171a21;">${heading}</h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b463f;">${intro}</p>
            ${content}
            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b645a;">
              Our concierge team is available 24/7. Reply to this email or call +92 3322334100 if you need anything.
            </p>
          </td>
        </tr>
        ${FOOTER}
      </table>
    </div>
  `
}

export function emailRow(label, value) {
  return `
    <tr>
      <td style="padding:9px 0;font-size:13px;color:#6b645a;">${label}</td>
      <td style="padding:9px 0;font-size:13px;color:#171a21;text-align:right;font-weight:bold;">${value}</td>
    </tr>
  `
}

export function emailTable(rows) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows.join('')}
    </table>
  `
}

export function referenceBlock(reference) {
  return `
    <div style="margin-bottom:22px;padding:14px 16px;background:#faf6ec;border:1px solid #eadfc4;border-radius:12px;">
      <div style="font-size:11px;letter-spacing:2px;color:#8a8175;text-transform:uppercase;">Booking reference</div>
      <div style="margin-top:4px;font-size:18px;font-weight:bold;color:#171a21;">${reference}</div>
    </div>
  `
}
