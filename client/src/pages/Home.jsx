import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'
import InvoiceModal from '../components/bookings/InvoiceModal.jsx'
import {
  FeaturedSuites,
  GuestVoices,
  HotelHighlights,
  OurStory,
  SignatureExperiences,
} from '../components/guest/GuestHomeSections.jsx'
import {
  useHeroFadeUp,
  useHoverLift,
  useStaggerReveal,
} from '../hooks/useLuxuryAnimations.js'
import { getMyBookings } from '../services/bookingService.js'
import { getStats } from '../services/dashboardService.js'
import { getRooms } from '../services/roomService.js'
import { formatPKR, formatStayDate } from '../utils/formatters.js'

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

const LUXURY_LOBBY_IMAGE =
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80'

const BOOKING_STATUS_BADGES = {
  pending: 'bg-warning-surface text-warning',
  confirmed: 'bg-success-surface text-success',
  'checked-in': 'bg-info-surface text-info',
  'checked-out': 'bg-elevated text-muted',
  cancelled: 'bg-danger-surface text-danger',
}

function Home() {
  const { user } = useAuth()
  const isGuest = user?.role === 'guest'
  const isStaff = STAFF_ROLES.includes(user?.role)
  const isVisitor = !user

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(isGuest)
  const [invoiceBookingId, setInvoiceBookingId] = useState(null)
  const [featuredRooms, setFeaturedRooms] = useState([])
  const [isRoomsLoading, setIsRoomsLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [isStatsLoading, setIsStatsLoading] = useState(isStaff)
  const [statsError, setStatsError] = useState('')

  const guestScopeRef = useRef(null)
  const reservationsRef = useRef(null)
  const guestRenderKey = isGuest ? `${isLoading}-${bookings.length}` : ''

  useHeroFadeUp(guestScopeRef)
  useStaggerReveal(reservationsRef, guestRenderKey)
  useHoverLift(guestScopeRef, guestRenderKey)

  useEffect(() => {
    if (!isGuest) return undefined

    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const nextBookings = await getMyBookings()
        if (!cancelled) setBookings(nextBookings)
      } catch {
        if (!cancelled) setBookings([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isGuest])

  useEffect(() => {
    if (isStaff) return undefined

    let cancelled = false

    async function load() {
      setIsRoomsLoading(true)
      try {
        const nextRooms = await getRooms()
        if (!cancelled) {
          const available = nextRooms.filter(
            (room) => room.status === 'available',
          )

          // Lead with the most premium available rooms.
          available.sort((a, b) => b.pricePerNight - a.pricePerNight)
          setFeaturedRooms(available.slice(0, 3))
        }
      } catch {
        if (!cancelled) setFeaturedRooms([])
      } finally {
        if (!cancelled) setIsRoomsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isGuest, isStaff])

  useEffect(() => {
    if (!isStaff) return undefined

    let cancelled = false

    async function load() {
      setIsStatsLoading(true)
      setStatsError('')
      try {
        const nextStats = await getStats()
        if (!cancelled) setStats(nextStats)
      } catch (requestError) {
        if (!cancelled) {
          setStatsError(
            requestError.response?.data?.message ??
              'Unable to load dashboard stats. Please try again.',
          )
        }
      } finally {
        if (!cancelled) setIsStatsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isStaff])

  if (isGuest || isVisitor) {
    return (
      <section ref={guestScopeRef} className="pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950 shadow-2xl">
          <img
            src={LUXURY_LOBBY_IMAGE}
            alt="Luxury hotel lobby"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-900/25" />

          <div className="relative px-6 py-16 sm:px-10 sm:py-24">
            <p
              data-hero-animate
              className="text-xs font-semibold tracking-[0.28em] text-amber-300 uppercase"
            >
              Five-star escape
            </p>
            <h1
              data-hero-animate
              className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white sm:text-6xl"
            >
              {isGuest
                ? `Welcome back, ${user?.name?.split(' ')[0] ?? 'Guest'}`
                : 'Welcome to LuxuryStay'}
            </h1>
            <p
              data-hero-animate
              className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base"
            >
              Your private retreat awaits. Explore curated suites and let our concierge
              craft every detail of your stay.
            </p>
            <div data-hero-animate className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/rooms"
                className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
              >
                Explore Suites
              </Link>
              <Link
                to={isGuest ? '/services' : '/experiences'}
                className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {isGuest ? 'Concierge Services' : 'Signature Experiences'}
              </Link>
            </div>
          </div>
        </div>

        <HotelHighlights />
        <FeaturedSuites rooms={featuredRooms} isLoading={isRoomsLoading} />

        {isGuest ? (
          <div ref={reservationsRef} className="mt-14">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
                Your stays
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
                My Reservations
              </h2>
            </div>
            <Link
              to="/rooms"
              className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
            >
              Book another stay
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  data-reveal
                  className="h-56 animate-pulse rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div
              data-reveal
              className="mt-6 overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-white to-amber-50 p-10 text-center shadow-sm dark:from-slate-900 dark:to-slate-950"
            >
              <p className="font-display text-2xl">You have no upcoming trips</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Reserve a suite and let LuxuryStay turn your next escape into an
                occasion.
              </p>
              <Link
                to="/rooms"
                className="mt-6 inline-flex items-center rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                Explore Suites
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {bookings.map((booking) => {
                const room = booking.room
                const totalPrice = booking.totalPrice
                const statusClass =
                  BOOKING_STATUS_BADGES[booking.status] ??
                  'bg-elevated text-muted'

                return (
                  <article
                    key={booking._id}
                    data-reveal
                    data-hover-lift
                    className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-amber-500/15 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
                          Room {room?.roomNumber ?? '—'}
                        </p>
                        <h3 className="mt-2 font-display text-2xl">
                          {room?.type ?? 'Suite'}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}
                      >
                        {booking.status.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-y border-stone-200 py-4 text-sm dark:border-slate-800">
                      <div>
                        <p className="text-xs tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                          Check-in
                        </p>
                        <p className="mt-1 font-medium">
                          {formatStayDate(booking.checkInDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                          Check-out
                        </p>
                        <p className="mt-1 font-medium">
                          {formatStayDate(booking.checkOutDate)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                          Total
                        </p>
                        <p className="mt-1 font-display text-2xl">
                          {formatPKR(totalPrice)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInvoiceBookingId(booking._id)}
                        className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                      >
                        View Invoice
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          </div>
        ) : null}

        <SignatureExperiences />
        <OurStory />
        <GuestVoices />

        {invoiceBookingId ? (
          <InvoiceModal
            bookingId={invoiceBookingId}
            onClose={() => setInvoiceBookingId(null)}
          />
        ) : null}
      </section>
    )
  }

  if (!isStaff) {
    return (
      <section className="py-12">
        <h1 className="font-display text-3xl tracking-tight">Dashboard</h1>
        <p className="mt-4 text-sm text-muted">
          Your role does not include the operations dashboard.
        </p>
      </section>
    )
  }

  const recentBookings = stats?.recentBookings ?? []
  const notifications = stats?.notifications ?? []

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Operations
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Staff Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted">
            Live inventory, stays, and revenue.
          </p>
        </div>
        <Link
          to="/bookings"
          className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
        >
          Manage All Bookings
        </Link>
      </div>

      {statsError ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-danger/40 bg-danger-surface p-6 text-sm text-danger"
        >
          <p>{statsError}</p>
          <button
            type="button"
            onClick={() => {
              setIsStatsLoading(true)
              setStatsError('')
              getStats()
                .then((nextStats) => setStats(nextStats))
                .catch((requestError) => {
                  setStatsError(
                    requestError.response?.data?.message ??
                      'Unable to load dashboard stats. Please try again.',
                  )
                })
                .finally(() => setIsStatsLoading(false))
            }}
            className="mt-3 rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-danger/10"
          >
            Try again
          </button>
        </div>
      ) : null}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Total Revenue
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">
            {isStatsLoading ? '…' : formatPKR(stats?.totalRevenue ?? 0)}
          </p>
        </li>
        <li className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Active Bookings
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">
            {isStatsLoading ? '…' : (stats?.activeBookings ?? 0)}
          </p>
        </li>
        <li className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Room Availability
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">
            {isStatsLoading
              ? '…'
              : `${stats?.availableRooms ?? 0} / ${stats?.totalRooms ?? 0}`}
          </p>
          <p className="mt-2 text-xs text-muted">Available / total rooms</p>
        </li>
        <li className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Occupancy Rate
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">
            {isStatsLoading ? '…' : `${stats?.occupancyRate ?? 0}%`}
          </p>
          <p className="mt-2 text-xs text-muted">
            {stats?.occupiedRooms ?? 0} occupied{' '}
            {(stats?.occupiedRooms ?? 0) === 1 ? 'room' : 'rooms'}
          </p>
        </li>
      </ul>

      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-4 py-4 sm:px-6 dark:border-slate-800">
          <h2 className="font-display text-2xl">Alerts &amp; Notifications</h2>
          <span className="text-xs text-muted">
            {isStatsLoading ? '…' : `${notifications.length} open`}
          </span>
        </div>

        {isStatsLoading ? (
          <ul className="divide-y divide-stone-200 dark:divide-slate-800">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="h-4 w-48 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-64 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
              </li>
            ))}
          </ul>
        ) : notifications.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted">
            You&apos;re all caught up. No pending alerts.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 dark:divide-slate-800">
            {notifications.map((notification) => {
              const isHighPriority = notification.priority === 'high'
              const badgeClass =
                notification.type === 'booking'
                  ? 'bg-warning-surface text-warning'
                  : isHighPriority
                    ? 'bg-danger-surface text-danger'
                    : 'bg-info-surface text-info'

              return (
                <li key={`${notification.type}-${notification.id}`}>
                  <Link
                    to={notification.to}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-stone-100/70 sm:px-6 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase ${badgeClass}`}
                        >
                          {notification.type === 'booking' ? 'Booking' : 'Service'}
                        </span>
                        <span className="capitalize">{notification.title}</span>
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {notification.message}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted">
                      {formatStayDate(notification.createdAt)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <h2 className="font-display text-2xl">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium sm:px-6">
                  Guest
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Room
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Stay
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 font-medium sm:px-6">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isStatsLoading
                ? Array.from({ length: 3 }, (_, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-stone-200 dark:border-slate-800">
                      {Array.from({ length: 5 }, (_, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-4 sm:px-6">
                          <div className="h-4 w-20 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : null}

              {!isStatsLoading && recentBookings.length === 0 ? (
                <tr className="border-t border-stone-200 dark:border-slate-800">
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">
                    No recent bookings.
                  </td>
                </tr>
              ) : null}

              {!isStatsLoading
                ? recentBookings.map((booking) => {
                    const statusClass =
                      BOOKING_STATUS_BADGES[booking.status] ?? 'bg-elevated text-muted'

                    return (
                      <tr key={booking._id} className="border-t border-stone-200 dark:border-slate-800">
                        <th
                          scope="row"
                          className="px-4 py-4 font-medium whitespace-nowrap sm:px-6"
                        >
                          {booking.user?.name ?? '—'}
                        </th>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {booking.room?.roomNumber ?? '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {formatStayDate(booking.checkInDate)} –{' '}
                          {formatStayDate(booking.checkOutDate)}
                        </td>
                        <td className="px-4 py-4 tabular-nums whitespace-nowrap">
                          {formatPKR(booking.totalPrice)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap sm:px-6">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default Home
