import { useEffect, useState } from 'react'

import { formatPKR, formatStayDate, countNights } from '../utils/formatters.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyBookings } from '../services/bookingService.js'

function Home() {
  const { user } = useAuth()
  const isGuest = user?.role === 'guest'

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isGuest) {
      async function load() {
        setIsLoading(true)
        try {
          const bookings = await getMyBookings()
          setBookings(bookings)
        } catch (requestError) {
          // Silently fail — the guest dashboard is decorative.
        } finally {
          setIsLoading(false)
        }
      }
      load()
    } else if (user?.role && !['admin', 'manager', 'receptionist'].includes(user.role)) {
      // Staff roles show a placeholder; the real dashboard will come later.
    }
  }, [isGuest])

  if (!user) {
    return <p className="text-sm text-muted">Sign in to view your dashboard.</p>
  }

  if (isGuest) {
    return (
      <section className="py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-content mb-6">My Reservations</h2>

          {isLoading ? (
            <p className="text-muted">Loading…</p>
          ) : bookings.length === 0 ? (
            <p className="text-muted text-center">
              You have no upcoming trips.{' '}
              <Link to="/rooms" className="font-medium text-success underline">
                Book a room
              </Link>
              and start your stay.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {bookings.map((booking) => {
                const room = booking.room
                const nights = countNights(booking.checkInDate, booking.checkOutDate)
                const totalPrice = Math.round(nights * room.pricePerNight * 100) / 100

                return (
                  <div
                    key={booking._id}
                    className="rounded-2xl border border-line bg-surface p-5 hover:bg-elevated transition-colors"
                  >
                    <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
                      {room?.roomNumber ?? '—'}
                    </p>
                    <h3 className="mt-2 font-semibold">
                      {room?.type ?? '—'}
                    </h3>
                    <p className="mt-1 text-sm text-content">
                      {formatStayDate(booking.checkInDate)} –{' '}
                      {formatStayDate(booking.checkOutDate)}
                    </p>
                    <p className="mt-3 text-lg font-semibold">
                      {formatPKR(totalPrice)}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Status: {booking.status}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    )
  }

  // Staff member — placeholder for now
  return (
    <section className="py-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-muted">Staff Dashboard</h2>
        <p className="mt-4 text-muted text-center">
          Staff dashboard coming soon.
        </p>
      </div>
    </section>
  )
}

export default Home