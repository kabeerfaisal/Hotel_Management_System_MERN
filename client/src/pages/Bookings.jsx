import { useEffect } from 'react'

import { useAuth } from '../context/AuthContext.jsx'
import { formatPKR, formatStayDate, countNights } from '../utils/formatters.js'
import { updateBookingStatus } from '../services/bookingService.js'

const STATUS_COLOR_MAP = {
  pending: 'bg-warning-surface text-warning',
  confirmed: 'bg-success-surface text-success',
  checked_in: 'bg-info-surface text-info',
  checked_out: 'bg-muted text-muted',
  cancelled: 'bg-danger-surface text-danger',
}

function Bookings() {
  const { user } = useAuth()
  const isStaff = ['admin', 'manager', 'receptionist'].includes(user?.role)

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Staff only — already gated by RoleRoute, but double-check
    if (!isStaff) {
      return
    }

    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const bookings = await window.bookingService.getAllBookings()
        setBookings(bookings)
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ??
            'Unable to load bookings. Please try again.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [isStaff])

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

  if (!isStaff) {
    return null
  }

  return (
    <section>
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
            onClick={() => { setError(''); load() }}
            className="mt-3 rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-danger/10"
          >
            Try again
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface shadow-sm">
          <p className="p-4 text-sm text-muted">Loading reservations…</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase">
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
                      <tr key={rowIndex} className="border-t border-line">
                        {Array.from({ length: 7 }, (_, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-4 sm:px-6">
                            <div className="h-4 w-20 animate-pulse rounded bg-elevated" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}

                {!isLoading && bookings.length === 0 ? (
                  <tr className="border-t border-line">
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
                      const nights = countNights(
                        booking.checkInDate,
                        booking.checkOutDate,
                      )
                      const totalPrice = Math.round(nights * room.pricePerNight * 100) / 100

                      const statusColor = STATUS_COLOR_MAP[booking.status] ?? 'bg-elevated text-muted'

                      return (
                        <tr
                          key={booking._id}
                          className="border-t border-line transition-colors hover:bg-elevated/40"
                        >
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
                          </td>
                        </tr>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default Bookings