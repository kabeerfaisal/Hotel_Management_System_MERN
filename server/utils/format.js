const pkrFormatter = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 0,
})

export function formatPKR(value) {
  return `PKR ${pkrFormatter.format(Number(value) || 0)}`
}

export function formatStayDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatLabel(value) {
  return String(value ?? '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}
