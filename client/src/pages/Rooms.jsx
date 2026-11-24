import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import InvoiceModal from '../components/bookings/InvoiceModal.jsx'
import RoomFormModal from '../components/rooms/RoomFormModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  useHeroFadeUp,
  useHoverLift,
  useStaggerReveal,
} from '../hooks/useLuxuryAnimations.js'
import { createBooking, getRoomBookedDates } from '../services/bookingService.js'
import {
  createRoom,
  deleteRoom,
  getRooms,
  updateRoom,
} from '../services/roomService.js'
import { formatPKR, formatStayDate } from '../utils/formatters.js'

const STATUS_BADGES = {
  available: { label: 'Available', className: 'bg-success-surface text-success' },
  occupied: { label: 'Occupied', className: 'bg-danger-surface text-danger' },
  cleaning: { label: 'Cleaning', className: 'bg-warning-surface text-warning' },
  maintenance: { label: 'Maintenance', className: 'bg-info-surface text-info' },
}

const BOOKED_DATE_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  'checked-in': 'In residence',
}

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

const ROOM_IMAGES = {
  presidential:
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  suite:
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
  deluxe:
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  standard:
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  default:
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
}

function getRoomImage(type = '') {
  const normalized = type.toLowerCase()

  if (normalized.includes('presidential')) return ROOM_IMAGES.presidential
  if (normalized.includes('suite')) return ROOM_IMAGES.suite
  if (normalized.includes('deluxe')) return ROOM_IMAGES.deluxe
  if (normalized.includes('standard')) return ROOM_IMAGES.standard

  return ROOM_IMAGES.default
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function Rooms() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isStaff = STAFF_ROLES.includes(user?.role)
  const isGuest = user?.role === 'guest'
  const isVisitor = !user
  const canBrowse = !isStaff

  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [modalRoom, setModalRoom] = useState(null)

  const [guestModalRoom, setGuestModalRoom] = useState(null)
  const [guestModalError, setGuestModalError] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [invoiceBookingId, setInvoiceBookingId] = useState(null)
  const [bookedDates, setBookedDates] = useState([])
  const [isBookedDatesLoading, setIsBookedDatesLoading] = useState(false)
  const [bookedDatesError, setBookedDatesError] = useState('')
  const guestDialogRef = useRef(null)
  const pageScopeRef = useRef(null)

  const renderKey = `${canBrowse}-${isLoading}-${rooms.length}`

  useHeroFadeUp(pageScopeRef)
  useStaggerReveal(pageScopeRef, renderKey)
  useHoverLift(pageScopeRef, renderKey)

  const availableCount = useMemo(
    () => rooms.filter((room) => room.status === 'available').length,
    [rooms],
  )

  const reloadRooms = useCallback(async () => {
    try {
      setRooms(await getRooms())
      setError('')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load rooms. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadRooms()
  }, [reloadRooms])

  useEffect(() => {
    const dialog = guestDialogRef.current
    if (!dialog || !guestModalRoom) return undefined
    if (!dialog.open) dialog.showModal()

    if ('closedBy' in HTMLDialogElement.prototype) return undefined

    let pressedOutside = false
    const outside = (event) => {
      const rect = dialog.getBoundingClientRect()
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
    }
    const onPointerDown = (event) => {
      pressedOutside = outside(event)
    }
    const onPointerUp = (event) => {
      if (pressedOutside && outside(event)) dialog.close()
    }

    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [guestModalRoom])

  // Preview unavailable date ranges as soon as a guest opens the booking form.
  useEffect(() => {
    if (!guestModalRoom) return undefined

    let cancelled = false

    setIsBookedDatesLoading(true)
    setBookedDates([])
    setBookedDatesError('')

    getRoomBookedDates(guestModalRoom._id)
      .then((ranges) => {
        if (!cancelled) setBookedDates(ranges)
      })
      .catch(() => {
        if (!cancelled) {
          setBookedDatesError(
            'Unable to check booked dates right now. You can still submit your request.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsBookedDatesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [guestModalRoom])

  const openCreateRoom = () => {
    setModalRoom(null)
    setIsRoomModalOpen(true)
  }

  const openEditRoom = (room) => {
    setModalRoom(room)
    setIsRoomModalOpen(true)
  }

  const closeRoomModal = () => {
    setIsRoomModalOpen(false)
    setModalRoom(null)
  }

  const handleSaveRoom = async (values) => {
    if (modalRoom) {
      await updateRoom(modalRoom._id, values)
    } else {
      await createRoom(values)
    }

    setActionError('')
    await reloadRooms()
  }

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Delete room ${room.roomNumber}? This cannot be undone.`)) {
      return
    }

    setDeletingId(room._id)
    setActionError('')

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

  const closeGuestBooking = () => {
    setGuestModalRoom(null)
    setGuestModalError('')
    setIsBooking(false)
  }

  const handleGuestBookingSubmit = async (event) => {
    event.preventDefault()
    if (!guestModalRoom) return

    const form = new FormData(event.currentTarget)
    setGuestModalError('')
    setIsBooking(true)

    try {
      const booking = await createBooking({
        room: guestModalRoom._id,
        checkInDate: form.get('checkInDate'),
        checkOutDate: form.get('checkOutDate'),
        numberOfGuests: Number(form.get('numberOfGuests')),
        contactPhone: form.get('contactPhone'),
        specialRequests: form.get('specialRequests'),
      })

      guestDialogRef.current?.close()
      setConfirmedBooking(booking)
      setIsBooking(false)
      await reloadRooms()
    } catch (requestError) {
      setGuestModalError(
        requestError.response?.data?.message ??
          'Unable to create booking. Please try again.',
      )
      setIsBooking(false)
    }
  }

  const confirmedRoom =
    confirmedBooking?.room && typeof confirmedBooking.room === 'object'
      ? confirmedBooking.room
      : {}
  const confirmedBookingRef = confirmedBooking?._id
    ? `#${confirmedBooking._id.slice(-8).toUpperCase()}`
    : '—'

  return (
    <section ref={pageScopeRef}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            data-hero-animate
            className="text-xs font-medium tracking-[0.18em] text-amber-700 uppercase dark:text-amber-400"
          >
            {canBrowse ? 'Curated stays' : 'Inventory'}
          </p>
          <h1
            data-hero-animate
            className="mt-2 font-display text-3xl tracking-tight sm:text-4xl"
          >
            {canBrowse ? 'Suites & Rooms' : 'Rooms'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} · {availableCount}{' '}
            available
          </p>
          {isGuest ? (
            <p className="mt-1 text-xs text-muted">
              Choose an available room and book your stay.
            </p>
          ) : null}
          {isVisitor ? (
            <p className="mt-1 text-xs text-muted">
              Browse our suites, then sign in to reserve your stay.
            </p>
          ) : null}
        </div>

        {isStaff ? (
          <button
            type="button"
            onClick={openCreateRoom}
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
            Add room
          </button>
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
            onClick={() => {
              setIsLoading(true)
              reloadRooms()
            }}
            className="mt-3 rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-danger/10"
          >
            Try again
          </button>
        </div>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
        >
          {actionError}
        </p>
      ) : null}

      {canBrowse ? (
        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  data-reveal
                  className="h-96 animate-pulse rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-white to-amber-50 p-10 text-center shadow-sm dark:from-slate-900 dark:to-slate-950">
              <p className="font-display text-2xl">No suites available</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Our inventory is being refreshed. Please check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => {
                const badge = STATUS_BADGES[room.status] ?? {
                  label: room.status,
                  className: 'bg-elevated text-muted',
                }
                const amenities = room.amenities ?? []

                return (
                  <article
                    key={room._id}
                    data-reveal
                    data-hover-lift
                    className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-2xl dark:border-amber-500/15 dark:bg-slate-900"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={getRoomImage(room.type)}
                        alt={`${room.type} room`}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                      <span
                        className={`absolute top-4 left-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <p className="absolute bottom-4 left-4 text-[0.65rem] font-semibold tracking-[0.22em] text-amber-200 uppercase">
                        Room {room.roomNumber}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-display text-2xl">{room.type}</h2>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-amber-600/30 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                          Up to {room.capacity ?? 2} guests
                        </span>
                        {amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>

                      {room.description ? (
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                          {room.description}
                        </p>
                      ) : null}

                      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                        <div>
                          <p className="text-xs tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                            Per night
                          </p>
                          <p className="mt-1 font-display text-2xl">
                            {formatPKR(room.pricePerNight)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isVisitor) {
                              navigate('/login', {
                                state: { from: { pathname: '/rooms' } },
                              })
                              return
                            }

                            setGuestModalError('')
                            setGuestModalRoom(room)
                          }}
                          disabled={room.status !== 'available'}
                          className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase dark:bg-slate-800/60 dark:text-slate-300">
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
                    <tr key={rowIndex} className="border-t border-stone-200 dark:border-slate-800">
                      {Array.from({ length: 6 }, (_, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-4 sm:px-6">
                          <div className="h-4 w-20 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : null}

              {!isLoading && rooms.length === 0 ? (
                <tr className="border-t border-stone-200 dark:border-slate-800">
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="font-display text-xl">No rooms yet</p>
                    <p className="mt-2 text-sm text-muted">
                      {isStaff
                        ? 'Add the first room to start building the inventory.'
                        : 'No rooms are listed right now.'}
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
                    const isDeleting = deletingId === room._id

                    return (
                      <tr
                        key={room._id}
                        className="border-t border-stone-200 transition-colors hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
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
                                  className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                                onClick={() => openEditRoom(room)}
                                className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-elevated"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoom(room)}
                                disabled={isDeleting}
                                className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isDeleting ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          ) : isGuest ? (
                            <button
                              type="button"
                              onClick={() => {
                                setGuestModalError('')
                                setGuestModalRoom(room)
                              }}
                              disabled={room.status !== 'available'}
                              className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Book Now
                            </button>
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
      )}

      {isRoomModalOpen ? (
        <RoomFormModal
          room={modalRoom}
          onClose={closeRoomModal}
          onSubmit={handleSaveRoom}
        />
      ) : null}

      {guestModalRoom ? (
        <dialog
          ref={guestDialogRef}
          aria-labelledby="guest-booking-title"
          closedby="any"
          onClose={closeGuestBooking}
          className="w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-stone-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            New booking
          </p>
          <h2 id="guest-booking-title" className="mt-2 font-display text-2xl">
            Book room {guestModalRoom.roomNumber}
          </h2>

          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
            <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-amber-800 uppercase dark:text-amber-300">
              Unavailable / Already Booked Dates
            </p>

            {isBookedDatesLoading ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Checking availability…
              </p>
            ) : bookedDatesError ? (
              <p role="alert" className="mt-2 text-sm text-danger">
                {bookedDatesError}
              </p>
            ) : bookedDates.length === 0 ? (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                All upcoming dates currently available.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {bookedDates.map((range, index) => (
                  <li
                    key={`${range.checkInDate}-${range.checkOutDate}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-white px-3 py-2 text-sm dark:border-amber-500/15 dark:bg-slate-900"
                  >
                    <span className="font-medium">
                      {formatStayDate(range.checkInDate)} →{' '}
                      {formatStayDate(range.checkOutDate)}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-500/15 dark:text-amber-300">
                      {BOOKED_DATE_LABELS[range.status] ?? range.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Choose dates outside these ranges to reserve this suite.
            </p>
          </div>

          {guestModalError ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
            >
              {guestModalError}
            </p>
          ) : null}

          <form onSubmit={handleGuestBookingSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="checkInDate" className="mb-1.5 block text-sm font-medium">
                Check-in date
              </label>
              <input
                id="checkInDate"
                name="checkInDate"
                type="date"
                required
                autoFocus
                min={todayInputValue()}
                defaultValue={todayInputValue()}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="checkOutDate" className="mb-1.5 block text-sm font-medium">
                Check-out date
              </label>
              <input
                id="checkOutDate"
                name="checkOutDate"
                type="date"
                required
                min={todayInputValue()}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="numberOfGuests" className="mb-1.5 block text-sm font-medium">
                  Guests
                </label>
                <input
                  id="numberOfGuests"
                  name="numberOfGuests"
                  type="number"
                  required
                  min="1"
                  max={guestModalRoom.capacity ?? 2}
                  defaultValue="1"
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <p className="mt-1.5 text-xs text-muted">
                  This room accommodates up to {guestModalRoom.capacity ?? 2}{' '}
                  {(guestModalRoom.capacity ?? 2) === 1 ? 'guest' : 'guests'}.
                </p>
              </div>

              <div>
                <label htmlFor="contactPhone" className="mb-1.5 block text-sm font-medium">
                  Contact phone
                </label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  required
                  maxLength={20}
                  defaultValue={user?.phone ?? ''}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="specialRequests" className="mb-1.5 block text-sm font-medium">
                Special requests
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                rows={2}
                maxLength={500}
                placeholder="Late check-in, extra pillows, airport pickup…"
                className="w-full resize-y rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => guestDialogRef.current?.close()}
                className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBooking}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBooking ? 'Booking…' : 'Book Now'}
              </button>
            </div>
          </form>
        </dialog>
      ) : null}

      {confirmedBooking ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-confirmed-title"
            className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-white p-6 text-slate-900 shadow-2xl sm:p-8 dark:border-amber-500/25 dark:bg-slate-900 dark:text-slate-100"
          >
            <button
              type="button"
              onClick={() => setConfirmedBooking(null)}
              aria-label="Close confirmation"
              className="absolute top-4 right-4 rounded-full border border-stone-200 p-1.5 text-slate-500 transition-colors hover:bg-stone-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>

            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-8 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5 13 4 4L19 7"
                />
              </svg>
            </div>

            <p className="mt-5 text-center text-[0.65rem] font-semibold tracking-[0.24em] text-amber-700 uppercase dark:text-amber-400">
              Reservation confirmed
            </p>
            <h2
              id="booking-confirmed-title"
              className="mt-2 text-center font-display text-3xl tracking-tight"
            >
              Your Suite is Reserved
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
              Our concierge will be in touch to perfect the details of your stay.
            </p>

            <dl className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-stone-50/70 px-4 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">Booking ID</dt>
                <dd className="font-semibold tracking-wide">{confirmedBookingRef}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">Suite</dt>
                <dd className="text-right font-semibold">
                  {confirmedRoom.type ?? 'Suite'}
                  {confirmedRoom.roomNumber
                    ? ` · Room ${confirmedRoom.roomNumber}`
                    : ''}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">Check-in</dt>
                <dd className="font-semibold">
                  {formatStayDate(confirmedBooking.checkInDate)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">Check-out</dt>
                <dd className="font-semibold">
                  {formatStayDate(confirmedBooking.checkOutDate)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">Guests</dt>
                <dd className="font-semibold">
                  {confirmedBooking.numberOfGuests}{' '}
                  {confirmedBooking.numberOfGuests === 1 ? 'guest' : 'guests'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-slate-500 dark:text-slate-400">
                  Estimated total
                </dt>
                <dd className="font-display text-xl text-amber-700 dark:text-amber-400">
                  {formatPKR(confirmedBooking.totalPrice)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setInvoiceBookingId(confirmedBooking._id)
                  setConfirmedBooking(null)
                }}
                className="flex-1 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                View / Print Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmedBooking(null)
                  navigate('/my-reservations')
                }}
                className="flex-1 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold transition-colors hover:bg-stone-100 dark:border-amber-500/25 dark:hover:bg-slate-800"
              >
                View My Reservations
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {invoiceBookingId ? (
        <InvoiceModal
          bookingId={invoiceBookingId}
          onClose={() => setInvoiceBookingId(null)}
        />
      ) : null}
    </section>
  )
}

export default Rooms
