import { useEffect, useMemo, useState } from 'react'

import {
  getRoomBookedDates,
  updateBookingDates,
} from '../../services/bookingService.js'
import { countNights, formatPKR, formatStayDate } from '../../utils/formatters.js'

const inputClassName =
  'w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500'

function toDateInput(value) {
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function addDays(value, days) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function sameDay(left, right) {
  return toDateInput(left) === toDateInput(right)
}

/**
 * Date editor for pending/confirmed reservations, and stay-change requests
 * for guests who are already checked in.
 */
function BookingDatesModal({ booking, mode, onClose, onSaved }) {
  const isRequest = mode === 'request'
  const room = booking.room ?? {}
  const pricePerNight = Number(room.pricePerNight) || 0
  const currentCheckIn = toDateInput(booking.checkInDate)

  const [checkIn, setCheckIn] = useState(currentCheckIn)
  const [checkOut, setCheckOut] = useState(toDateInput(booking.checkOutDate))
  const [note, setNote] = useState('')
  const [bookedDates, setBookedDates] = useState([])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!room._id) return undefined

    getRoomBookedDates(room._id)
      .then((ranges) => {
        if (!cancelled) setBookedDates(ranges)
      })
      .catch(() => {
        if (!cancelled) setBookedDates([])
      })

    return () => {
      cancelled = true
    }
  }, [room._id])

  // The room's public calendar includes this reservation; hide its own range.
  const otherBookedRanges = useMemo(
    () =>
      bookedDates.filter(
        (range) =>
          !(
            sameDay(range.checkInDate, booking.checkInDate) &&
            sameDay(range.checkOutDate, booking.checkOutDate)
          ),
      ),
    [bookedDates, booking.checkInDate, booking.checkOutDate],
  )

  const nights = countNights(checkIn, checkOut)
  const estimatedTotal =
    nights > 0 ? Math.round(nights * pricePerNight * 100) / 100 : 0

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!checkIn || !checkOut) {
      setError('Choose both a check-in and check-out date.')
      return
    }

    if (countNights(checkIn, checkOut) < 1) {
      setError('Check-out date must be after the check-in date.')
      return
    }

    setIsSaving(true)

    try {
      const payload = isRequest
        ? { requestedCheckOutDate: checkOut, note: note.trim() }
        : { checkInDate: checkIn, checkOutDate: checkOut }

      onSaved(await updateBookingDates(booking._id, payload))
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to update this reservation. Please try again.',
      )
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close date editor"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dates-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 text-slate-900 shadow-2xl sm:p-8 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-400">
          {isRequest ? 'Stay change' : 'Modify reservation'}
        </p>
        <h2 id="booking-dates-title" className="mt-2 font-display text-2xl">
          {isRequest ? 'Request a new check-out' : 'Edit your dates'}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Room {room.roomNumber ?? '—'} · Current stay{' '}
          {formatStayDate(booking.checkInDate)} to{' '}
          {formatStayDate(booking.checkOutDate)}
        </p>

        <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200">
          <p className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase">
            Already booked for this room
          </p>
          {otherBookedRanges.length ? (
            <ul className="mt-2 space-y-1">
              {otherBookedRanges.map((range, index) => (
                <li key={`${range.checkInDate}-${index}`}>
                  {formatStayDate(range.checkInDate)} →{' '}
                  {formatStayDate(range.checkOutDate)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">No other reservations block this room.</p>
          )}
          <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/70">
            Choose dates outside these ranges. Your current reservation dates
            are excluded.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          {isRequest ? (
            <div>
              <label
                htmlFor="requested-check-out"
                className="mb-1.5 block text-sm font-medium"
              >
                Requested check-out date
              </label>
              <input
                id="requested-check-out"
                type="date"
                required
                min={addDays(currentCheckIn, 1)}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className={inputClassName}
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="edit-check-in"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Check-in date
                </label>
                <input
                  id="edit-check-in"
                  type="date"
                  required
                  value={checkIn}
                  onChange={(event) => {
                    const next = event.target.value
                    setCheckIn(next)
                    if (countNights(next, checkOut) < 1) {
                      setCheckOut(addDays(next, 1))
                    }
                  }}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-check-out"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Check-out date
                </label>
                <input
                  id="edit-check-out"
                  type="date"
                  required
                  min={checkIn}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className={inputClassName}
                />
              </div>
            </>
          )}

          {isRequest ? (
            <div>
              <label
                htmlFor="stay-change-note"
                className="mb-1.5 block text-sm font-medium"
              >
                Note for the front desk (optional)
              </label>
              <textarea
                id="stay-change-note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Let us know why you would like to extend your stay."
                className={inputClassName}
              />
            </div>
          ) : null}

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400">
                {nights > 0
                  ? `${nights} ${nights === 1 ? 'night' : 'nights'}`
                  : 'Select valid dates'}
              </span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {formatPKR(estimatedTotal)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isRequest
                ? 'Estimated total if approved. Reception will confirm and update the reservation.'
                : 'Recalculated from the room nightly rate.'}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-stone-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {isSaving
                ? 'Saving…'
                : isRequest
                  ? 'Submit request'
                  : 'Save dates'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default BookingDatesModal
