import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '../context/AuthContext.jsx'
import InvoiceModal from '../components/bookings/InvoiceModal.jsx'
import { usePageFade } from '../hooks/useLuxuryAnimations.js'
import {
  getAllBookings,
  reviewStayChangeRequest,
  updateBookingStatus,
} from '../services/bookingService.js'
import { formatPKR, formatStayDate } from '../utils/formatters.js'

const STATUS_COLOR_MAP = {
  pending: 'bg-warning-surface text-warning',
  confirmed: 'bg-success-surface text-success',
  'checked-in': 'bg-info-surface text-info',
  'checked-out': 'bg-elevated text-muted',
  cancelled: 'bg-danger-surface text-danger',
}

function Bookings() {
  const { user } = useAuth()
  const isStaff = ['admin', 'manager', 'receptionist'].includes(user?.role)

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [invoiceBookingId, setInvoiceBookingId] = useState(null)
  const [reviewingId, setReviewingId] = useState(null)

  const pageRef = useRef(null)
  usePageFade(pageRef)

  const load = useCallback(async () => {
    try {
      setBookings(await getAllBookings())
      setError('')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load bookings. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isStaff) return
    load()
  }, [isStaff, load])

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateBookingStatus(id, status)
      await load()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to update booking status. Please try again.',
      )
    }
  }

  const handleStayRequest = async (id, action) => {
    setReviewingId(id)
    setError('')
    setNotice('')

    try {
      await reviewStayChangeRequest(id, action)
      setNotice(
        `Stay change request ${action === 'approve' ? 'approved' : 'rejected'}.`,
      )
      await load()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to review the stay change request. Please try again.',
      )
    } finally {
      setReviewingId(null)
    }
  }

  if (!isStaff) {
    return null
  }

  return (
    <section ref={pageRef}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Reservations
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Bookings
          </h1>
          <p className="mt-2 text-sm text-muted">
            {bookings.length} {bookings.length !== 1 ? 'reservations' : 'reservation'}
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-danger/40 bg-danger-surface p-6 text-sm text-danger"
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

      {notice ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-success/30 bg-success-surface px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="p-4 text-sm text-muted">Loading reservations…</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-6">
                    Guest
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Room
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Check-in
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Check-out
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Total (PKR)
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }, (_, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-stone-200 dark:border-slate-800">
                        {Array.from({ length: 7 }, (_, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-4 sm:px-6">
                            <div className="h-4 w-20 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}

                {!isLoading && bookings.length === 0 ? (
                  <tr className="border-t border-stone-200 dark:border-slate-800">
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="font-display text-xl">No bookings yet</p>
                      <p className="mt-2 text-sm text-muted">
                        No reservations in the system.
                      </p>
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? bookings.map((booking) => {
                      const guest = booking.user
                      const room = booking.room
                      const totalPrice = booking.totalPrice

                      const statusColor = STATUS_COLOR_MAP[booking.status] ?? 'bg-elevated text-muted'
                      const stayChange = booking.stayChangeRequest
                      const hasPendingStayChange =
                        booking.status === 'checked-in' &&
                        stayChange?.status === 'pending'

                      return (
                        <Fragment key={booking._id}>
                          <tr className="border-t border-stone-200 transition-colors hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                          <td
                            scope="row"
                            className="px-4 py-4 font-medium whitespace-nowrap sm:px-6"
                          >
                            {guest?.name ?? '—'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {room?.roomNumber ?? '—'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {formatStayDate(booking.checkInDate)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {formatStayDate(booking.checkOutDate)}
                          </td>
                          <td className="px-4 py-4 tabular-nums whitespace-nowrap">
                            {formatPKR(totalPrice)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setInvoiceBookingId(booking._id)}
                                className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-elevated"
                              >
                                View Invoice
                              </button>
                              <select
                                onChange={(e) => {
                                  if (
                                    window.confirm(
                                      `Update booking ${booking.room?.roomNumber} to ${e.target.value}?`,
                                    )
                                  ) {
                                    handleStatusUpdate(booking._id, e.target.value)
                                  }
                                }}
                                value={booking.status}
                                className="rounded-lg border border-line px-2 py-1 text-xs font-semibold transition-colors"
                              >
                                <option value="pending">pending</option>
                                <option value="confirmed">confirmed</option>
                                <option value="checked-in">checked-in</option>
                                <option value="checked-out">checked-out</option>
                                <option value="cancelled">cancelled</option>
                              </select>
                            </div>
                          </td>
                        </tr>

                        {hasPendingStayChange ? (
                          <tr className="border-t border-amber-500/30 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5">
                            <td colSpan={7} className="px-4 py-4 sm:px-6">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="text-sm">
                                  <p className="text-xs font-semibold tracking-[0.14em] text-amber-700 uppercase dark:text-amber-400">
                                    Stay change request
                                  </p>
                                  <p className="mt-1 font-medium">
                                    Requested check-out:{' '}
                                    {formatStayDate(
                                      stayChange.requestedCheckOutDate,
                                    )}
                                  </p>
                                  {stayChange.requestedCheckInDate ? (
                                    <p className="mt-0.5 text-xs text-muted">
                                      Requested check-in:{' '}
                                      {formatStayDate(
                                        stayChange.requestedCheckInDate,
                                      )}
                                    </p>
                                  ) : null}
                                  {stayChange.note ? (
                                    <p className="mt-1 text-muted">
                                      Note: {stayChange.note}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-muted">
                                    Requested{' '}
                                    {formatStayDate(stayChange.requestedAt)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStayRequest(booking._id, 'approve')
                                    }
                                    disabled={reviewingId === booking._id}
                                    className="rounded-full border border-success/40 px-4 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success-surface disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {reviewingId === booking._id
                                      ? 'Saving…'
                                      : 'Approve'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStayRequest(booking._id, 'reject')
                                    }
                                    disabled={reviewingId === booking._id}
                                    className="rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                        </Fragment>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
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

export default Bookings