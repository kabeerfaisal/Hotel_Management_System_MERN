import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import InvoiceModal from '../components/bookings/InvoiceModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  useHeroFadeUp,
  useHoverLift,
  useStaggerReveal,
} from '../hooks/useLuxuryAnimations.js'
import { cancelBooking, getMyBookings } from '../services/bookingService.js'
import { countNights, formatPKR, formatStayDate } from '../utils/formatters.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const FILTER_STATUSES = {
  upcoming: ['pending', 'confirmed', 'checked-in'],
  completed: ['checked-out'],
  cancelled: ['cancelled'],
}

const STATUS_BADGES = {
  pending: { label: 'Pending', className: 'bg-warning-surface text-warning' },
  confirmed: { label: 'Confirmed', className: 'bg-success-surface text-success' },
  'checked-in': { label: 'In residence', className: 'bg-info-surface text-info' },
  'checked-out': { label: 'Completed', className: 'bg-elevated text-muted' },
  cancelled: { label: 'Cancelled', className: 'bg-danger-surface text-danger' },
}

const CANCELLABLE_STATUSES = ['pending', 'confirmed']

function bookingReference(id) {
  return `#${String(id).slice(-8).toUpperCase()}`
}

function MyReservations() {
  const { user } = useAuth()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [invoiceBookingId, setInvoiceBookingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  const pageRef = useRef(null)

  const load = useCallback(async () => {
    try {
      setBookings(await getMyBookings())
      setError('')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load your reservations. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(
    () => ({
      all: bookings.length,
      upcoming: bookings.filter((booking) =>
        FILTER_STATUSES.upcoming.includes(booking.status),
      ).length,
      completed: bookings.filter((booking) =>
        FILTER_STATUSES.completed.includes(booking.status),
      ).length,
      cancelled: bookings.filter((booking) =>
        FILTER_STATUSES.cancelled.includes(booking.status),
      ).length,
    }),
    [bookings],
  )

  const visibleBookings = useMemo(() => {
    if (activeFilter === 'all') return bookings

    return bookings.filter((booking) =>
      FILTER_STATUSES[activeFilter].includes(booking.status),
    )
  }, [activeFilter, bookings])

  const renderKey = `${isLoading}-${activeFilter}-${visibleBookings.length}`

  useHeroFadeUp(pageRef)
  useStaggerReveal(pageRef, renderKey)
  useHoverLift(pageRef, renderKey)

  const handleCancel = async (booking) => {
    const reference = bookingReference(booking._id)

    if (
      !window.confirm(
        `Cancel reservation ${reference}? This releases the dates and cannot be undone.`,
      )
    ) {
      return
    }

    setCancellingId(booking._id)
    setError('')
    setNotice('')

    try {
      const updated = await cancelBooking(booking._id)
      setBookings((previous) =>
        previous.map((item) => (item._id === updated._id ? updated : item)),
      )
      setNotice(`Reservation ${reference} has been cancelled.`)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to cancel this reservation. Please try again.',
      )
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section ref={pageRef} className="pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            data-hero-animate
            className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-400"
          >
            Your stays
          </p>
          <h1
            data-hero-animate
            className="mt-2 font-display text-3xl tracking-tight sm:text-4xl"
          >
            My Reservations
          </h1>
          <p
            data-hero-animate
            className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400"
          >
            {user?.name ? `${user.name}, ` : ''}review your stays, download invoices,
            and manage upcoming reservations.
          </p>
        </div>

        <Link
          to="/rooms"
          className="inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          Book another stay
        </Link>
      </div>

      {notice ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-success/30 bg-success-surface px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-danger/40 bg-danger-surface p-5 text-sm text-danger"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              load()
            }}
            className="mt-3 rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-danger/10"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.key

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-slate-950'
                  : 'border-stone-300 text-slate-600 hover:bg-stone-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              {filter.label}
              <span
                className={`ml-2 text-xs ${
                  active
                    ? 'text-white/80 dark:text-slate-900/70'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {counts[filter.key]}
              </span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              data-reveal
              className="h-72 animate-pulse rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : visibleBookings.length === 0 ? (
        <div
          data-reveal
          className="mt-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-white to-amber-50 p-10 text-center shadow-sm dark:from-slate-900 dark:to-slate-950"
        >
          <p className="font-display text-2xl">
            {activeFilter === 'all' ? 'No reservations yet' : `No ${activeFilter} stays`}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            {activeFilter === 'all'
              ? 'Your reserved suites will appear here, ready for invoices and concierge requests.'
              : 'Try another filter, or begin a new reservation to plan your next escape.'}
          </p>
          <Link
            to="/rooms"
            className="mt-6 inline-flex rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            Explore Suites
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {visibleBookings.map((booking) => {
            const status = STATUS_BADGES[booking.status] ?? {
              label: booking.status,
              className: 'bg-elevated text-muted',
            }
            const room = booking.room ?? {}
            const nights = countNights(booking.checkInDate, booking.checkOutDate)
            const isCancelling = cancellingId === booking._id
            const canCancel = CANCELLABLE_STATUSES.includes(booking.status)

            return (
              <article
                key={booking._id}
                data-reveal
                data-hover-lift
                className="flex flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-amber-500/15 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
                      Booking reference
                    </p>
                    <p className="mt-1 font-display text-xl tracking-wide">
                      {bookingReference(booking._id)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 border-t border-stone-200 pt-4 dark:border-slate-800">
                  <p className="font-display text-2xl">
                    {room.type ?? 'Suite'}
                    {room.roomNumber ? (
                      <span className="ml-2 text-base text-slate-500 dark:text-slate-400">
                        · Room {room.roomNumber}
                      </span>
                    ) : null}
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-[0.6rem] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        Check-in
                      </dt>
                      <dd className="mt-1 text-sm font-medium">
                        {formatStayDate(booking.checkInDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6rem] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        Check-out
                      </dt>
                      <dd className="mt-1 text-sm font-medium">
                        {formatStayDate(booking.checkOutDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6rem] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        Guests
                      </dt>
                      <dd className="mt-1 text-sm font-medium">
                        {booking.numberOfGuests}{' '}
                        {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6rem] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        Total
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {formatPKR(booking.totalPrice)}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {nights} {nights === 1 ? 'night' : 'nights'} · {room.type ?? 'Suite'}
                  </p>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setInvoiceBookingId(booking._id)}
                    className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-stone-100 dark:border-amber-500/25 dark:hover:bg-slate-800"
                  >
                    View / Print Invoice
                  </button>
                  {canCancel ? (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking)}
                      disabled={isCancelling}
                      className="flex-1 rounded-full border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCancelling ? 'Cancelling…' : 'Cancel Reservation'}
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {invoiceBookingId ? (
        <InvoiceModal
          bookingId={invoiceBookingId}
          onClose={() => setInvoiceBookingId(null)}
        />
      ) : null}
    </section>
  )
}

export default MyReservations
