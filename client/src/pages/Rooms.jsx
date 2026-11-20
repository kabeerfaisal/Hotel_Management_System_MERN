import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatPKR, formatStayDate, countNights } from '../utils/formatters.js'

import RoomFormModal from '../components/rooms/RoomFormModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  createRoom,
  deleteRoom,
  getRooms,
  updateRoom,
} from '../services/roomService.js'
import { createBooking, getAllBookings } from '../services/bookingService.js'

const STATUS_BADGES = {
  available: { label: 'Available', className: 'bg-success-surface text-success' },
  occupied: { label: 'Occupied', className: 'bg-danger-surface text-danger' },
  cleaning: { label: 'Cleaning', className: 'bg-warning-surface text-warning' },
  maintenance: { label: 'Maintenance', className: 'bg-info-surface text-info' },
}

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

function Rooms() {
  const { user } = useAuth()
  const isStaff = STAFF_ROLES.includes(user?.role)

  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [bookings, setBookings] = useState([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)

  const availableCount = useMemo(
    () => rooms.filter((room) => room.status === 'available').length,
    [rooms],
  )

  // ── Room loading ────────────────────────────────────────────
  const reloadRooms = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) setIsLoading(true)
    setError('')

    try {
      setRooms(await getRooms())
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load rooms. Please try again.',
      )
    } finally {
      if (showSpinner) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadRooms()
  }, [reloadRooms])

  // ── Bookings loading ────────────────────────────────────────
  const reloadBookings = useCallback(async () => {
    setIsLoadingBookings(true)
    setError('')

    try {
      setBookings(await getAllBookings())
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load bookings. Please try again.',
      )
    } finally {
      setIsLoadingBookings(false)
    }
  }, [])

  useEffect(() => {
    reloadBookings()
  }, [reloadBookings])

  const handleSaveRoom = async (values) => {
    if (modalRoom) {
      await updateRoom(modalRoom._id, values)
    } else {
      await createRoom(values)
    }

    setModalRoom(undefined)
    await reloadRooms()
  }

  const handleDeleteRoom = async (room) => {
    // ... same as before
    if (!window.confirm(`Delete room ${room.roomNumber}? This cannot be undone.`)) {
      return
    }

    setDeletingId(room._id)

    try {
      await deleteRoom(room._id)
      setRooms((previous) => previous.filter((item) => item._id !== room._id))
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ??
          `Unable to delete room ${room.roomNumber}. Please try again.`,
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ── Guest Book Now ───────────────────────────────────────────
  const [guestModalRoom, setGuestModalRoom] = useState(null)
  const [guestModalError, setGuestModalError] = useState('')

  const openGuestBooking = (room) => {
    setGuestModalRoom(room)
    setGuestModalError('')
  }

  const closeGuestBooking = () => {
    setGuestModalRoom(null)
    setGuestModalError('')
  }

  const handleGuestBookingSubmit = async (bookingData) => {
    try {
      const created = await createBooking({
        room: guestModalRoom._id,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        user: user?.id,
      })
      closeGuestBooking()
      await reloadRooms()
    } catch (requestError) {
      setGuestModalError(
        requestError.response?.data?.message ??
          'Unable to create booking. Please try again.',
      )
    }
  }

  // ── Staff bookings table ─────────────────────────────────────
  const statusColorMap = {
    pending: 'bg-warning-surface text-warning',
    confirmed: 'bg-success-surface text-success',
    checked_in: 'bg-info-surface text-info',
    checked_out: 'bg-muted text-muted',
    cancelled: 'bg-danger-surface text-danger',
  }

  return (
    <section>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Inventory
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Rooms
          </h1>
          <p className="mt-2 text-sm text-muted">
            {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} ·{' '}
            {availableCount} available
          </p>
          {!isStaff ? (
            <p className="mt-1 text-xs text-muted">
              Read-only access — admins and managers manage the inventory.
            </p>
          ) : null}
        </div>

        {isStaff ? (
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={() => setIsRoomModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-on-success transition-opacity hover:opacity-90"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-3"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M12 5v13M5 12h14" />
              </svg>
              Add room
            </button>
            <button
              type="button"
              onClick={() => reloadBookings()}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Staff bookings
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-danger/40 bg-danger-surface p-6 text-sm text-danger"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => reloadRooms({ showSpinner: true })}
            className="mt-3 rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-danger/10"
          >
            Try again
          </button>
        </div>
      ) : null}

      {/* ── Rooms table ────────────────────────────────────────── */}
      {isStaff ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
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
                    Total
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
                      const nights = countNights(booking.checkInDate, booking.checkOutDate)
                      const totalPrice = Math.round(nights * room.pricePerNight * 100) / 100

                      const statusBadge = STATUS_BADGES[booking.status] ?? {
                        label: booking.status,
                        className: 'bg-elevated text-muted',
                      }

                      const isCurrentUserGuest =
                        guest?.email?.endsWith('.test') &&
                        (guest.email.includes('guest') ||
                          user?.role === 'guest')

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
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                            {isStaff ? (
                              <div className="flex justify-end gap-1.5">
                                <select
                                  onChange={(e) => {
                                    if (
                                      window.confirm(
                                        `Update ${booking.room?.roomNumber} booking to ${e.target.value}?`,
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
                            ) : null}
                          </td>
                        </tr>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── Guest Booking Modal ─────────────────────────────────── */}
      {guestModalRoom && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            onClick={closeGuestBooking}
            aria-label="Close dialog"
            className="fixed inset-0 bg-black/50"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-booking-modal-title"
            className="relative my-8 w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-xl"
          >
            <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
              New booking
            </p>
            <h2 id="guest-booking-modal-title" className="mt-2 font-display text-2xl">
              Book room {guestModalRoom.roomNumber}
            </h2>

            {guestModalError ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
              >
                {guestModalError}
              </p>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = new FormData(e.target)
                const checkIn = form.get('checkIn')
                const checkOut = form.get('checkOut')
                handleGuestBookingSubmit({ checkIn, checkOut })
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label htmlFor="checkIn" className="mb-1.5 block text-sm font-medium">
                  Check-in date
                </label>
                <input
                  id="checkIn"
                  name="checkIn"
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong"
                />
              </div>

              <div>
                <label htmlFor="checkOut" className="mb-1.5 block text-sm font-medium">
                  Check-out date
                </label>
                <input
                  id="checkOut"
                  name="checkOut"
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeGuestBooking}
                  className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Book now
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ── Rooms table ────────────────────────────────────────── */}
      {isStaff ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-6">
                    Room
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Price (PKR)
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Amenities
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
                        {Array.from({ length: 6 }, (_, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-4 sm:px-6">
                            <div className="h-4 w-20 animate-pulse rounded bg-elevated" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}

                {!isLoading && rooms.length === 0 ? (
                  <tr className="border-t border-line">
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="font-display text-xl">No rooms yet</p>
                      <p className="mt-2 text-sm text-muted">
                        Add the first room to start building the inventory.
                      </p>
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? rooms.map((room) => {
                      const badge = STATUS_BADGES[room.status] ?? {
                        label: room.status,
                        className: 'bg-elevated text-muted',
                      }

                      return (
                        <tr
                          key={room._id}
                          className="border-t border-line transition-colors hover:bg-elevated/40"
                        >
                          <th
                            scope="row"
                            className="px-4 py-4 font-display text-base font-semibold whitespace-nowrap sm:px-6"
                          >
                            {room.roomNumber}
                          </th>
                          <td className="px-4 py-4 whitespace-nowrap">{room.type}</td>
                          <td className="px-4 py-4 tabular-nums whitespace-nowrap">
                            {formatPKR(room.pricePerNight)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {room.amenities?.length ? (
                              <div className="flex max-w-xs flex-wrap gap-1.5">
                                {room.amenities.map((amenity) => (
                                  <span
                                    key={amenity}
                                    className="rounded-full border border-line bg-elevated px-2 py-0.5 text-xs text-muted"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                            {isStaff ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setGuestModalRoom(room)}
                                  className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-elevated"
                                >
                                  Book
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}

{isRoomModalOpen && (
        <RoomFormModal
          room={undefined}
          onClose={() => setIsRoomModalOpen(false)}
          onSubmit={handleSaveRoom}
        />
      )}

export default Rooms