const pkrFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const stayDateFormatter = new Intl.DateTimeFormat('en-PK', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function formatPKR(amount) {
  const value = Number(amount)
  return Number.isFinite(value) ? pkrFormatter.format(value) : '—'
}

export function formatStayDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : stayDateFormatter.format(date)
}

export function countNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return 0

  const start = new Date(checkInDate)
  const end = new Date(checkOutDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

  const startDay = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  )
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())

  return Math.round((endDay - startDay) / MS_PER_DAY)
}
