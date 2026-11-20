import { useCallback, useEffect, useMemo, useState } from 'react'

import RoomFormModal from '../components/rooms/RoomFormModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  createRoom,
  deleteRoom,
  getRooms,
  updateRoom,
} from '../services/roomService.js'

const STAFF_ROLES = ['admin', 'manager']

const STATUS_BADGES = {
  available: { label: 'Available', className: 'bg-success-surface text-success' },
  occupied: { label: 'Occupied', className: 'bg-danger-surface text-danger' },
  cleaning: { label: 'Cleaning', className: 'bg-warning-surface text-warning' },
  maintenance: { label: 'Maintenance', className: 'bg-info-surface text-info' },
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function getRoomErrorMessage(requestError, fallback) {
  return requestError.response?.data?.message ?? fallback
}

function Rooms() {
  const { user } = useAuth()
  const canManage = STAFF_ROLES.includes(user?.role)

  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  // undefined = closed, null = create, room object = edit
  const [modalRoom, setModalRoom] = useState(undefined)

  const availableCount = useMemo(
    () => rooms.filter((room) => room.status === 'available').length,
    [rooms],
  )

  // Used by the retry button and after a room is saved. The initial load
  // lives in the effect below so state updates stay asynchronous.
  const reloadRooms = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) setIsLoading(true)
    setError('')

    try {
      setRooms(await getRooms())
    } catch (requestError) {
      setError(getRoomErrorMessage(requestError, 'Unable to load rooms. Please try again.'))
    } finally {
      if (showSpinner) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    getRooms()
      .then((loadedRooms) => {
        if (!isActive) return
        setRooms(loadedRooms)
      })
      .catch((requestError) => {
        if (!isActive) return
        setError(
          getRoomErrorMessage(requestError, 'Unable to load rooms. Please try again.'),
        )
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

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
    setActionError('')

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

  const columnCount = canManage ? 6 : 5

  return (
    <section>
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
          {!canManage ? (
            <p className="mt-1 text-xs text-muted">
              Read-only access — admins and managers manage the inventory.
            </p>
          ) : null}
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setModalRoom(null)}
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

      {actionError ? (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="text-xs font-semibold underline underline-offset-4"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-danger/40 bg-danger-surface p-6 text-sm text-danger"
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
      ) : (
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
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Amenities
                  </th>
                  {canManage ? (
                    <th scope="col" className="px-4 py-3 text-right font-medium sm:px-6">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }, (_, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-line">
                        {Array.from({ length: columnCount }, (_, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-4 sm:px-6">
                            <div className="h-4 w-20 animate-pulse rounded bg-elevated" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}

                {!isLoading && rooms.length === 0 ? (
                  <tr className="border-t border-line">
                    <td colSpan={columnCount} className="px-6 py-16 text-center">
                      <p className="font-display text-xl">No rooms yet</p>
                      <p className="mt-2 text-sm text-muted">
                        {canManage
                          ? 'Add the first room to start building the inventory.'
                          : 'Rooms will appear here once staff add them.'}
                      </p>
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => setModalRoom(null)}
                          className="mt-5 rounded-full border border-line-strong px-5 py-2 text-sm font-semibold transition-colors hover:bg-elevated"
                        >
                          Add your first room
                        </button>
                      ) : null}
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
                            {priceFormatter.format(room.pricePerNight)}
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
                          {canManage ? (
                            <td className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setModalRoom(room)}
                                  className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-elevated"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoom(room)}
                                  disabled={deletingId === room._id}
                                  className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger-surface disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingId === room._id ? 'Deleting…' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalRoom !== undefined ? (
        <RoomFormModal
          key={modalRoom?._id ?? 'new'}
          room={modalRoom}
          onClose={() => setModalRoom(undefined)}
          onSubmit={handleSaveRoom}
        />
      ) : null}
    </section>
  )
}

export default Rooms
