import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'
import { usePageFade } from '../hooks/useLuxuryAnimations.js'
import { getMyBookings } from '../services/bookingService.js'
import {
  createServiceRequest,
  getServiceRequests,
  updateServiceRequest,
} from '../services/serviceRequestService.js'
import { getRooms } from '../services/roomService.js'
import { formatPKR } from '../utils/formatters.js'

const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping']
const ACTIVE_BOOKING_STATUSES = ['confirmed', 'checked-in']

const CATEGORIES = [
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'room-service', label: 'Room Service' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'wake-up-call', label: 'Wake-up Call' },
]

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['pending', 'in-progress', 'completed']

const STATUS_NEXT = { pending: 'in-progress', 'in-progress': 'completed' }

const STAFF_TABS = [
  { key: 'all', label: 'All' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'guest-services', label: 'Guest Services' },
]

const GUEST_SERVICE_CATEGORIES = ['room-service', 'laundry', 'transportation', 'wake-up-call']

const STATUS_BADGE = {
  pending: 'bg-warning-surface text-warning',
  'in-progress': 'bg-info-surface text-info',
  completed: 'bg-success-surface text-success',
}
const PRIORITY_BADGE = {
  low: 'bg-elevated text-muted',
  medium: 'bg-warning-surface text-warning',
  high: 'bg-danger-surface text-danger',
}

const fieldClass =
  'w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500'

function cap(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

function RequestFormModal({ rooms, onClose, onSaved, staffMode }) {
  const dialogRef = useRef(null)
  const [values, setValues] = useState({
    category: staffMode ? 'housekeeping' : 'room-service',
    room: rooms[0]?._id ?? '',
    description: '',
    priority: 'medium',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    if ('closedBy' in HTMLDialogElement.prototype) return
    let pressedOutside = false
    const outside = (e) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }
    const onDown = (e) => { pressedOutside = outside(e) }
    const onUp = (e) => { if (pressedOutside && outside(e)) dialog.close() }
    dialog.addEventListener('pointerdown', onDown)
    dialog.addEventListener('pointerup', onUp)
    return () => {
      dialog.removeEventListener('pointerdown', onDown)
      dialog.removeEventListener('pointerup', onUp)
    }
  }, [])

  const set = (e) => {
    const { name, value } = e.target
    setValues((p) => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      const saved = await createServiceRequest(values)
      onSaved(saved)
      dialogRef.current?.close()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to submit request. Please try again.')
      setIsSaving(false)
    }
  }

  const categoryOptions = staffMode
    ? CATEGORIES
    : CATEGORIES.filter((c) => GUEST_SERVICE_CATEGORIES.includes(c.value) || c.value === 'maintenance')

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="sr-form-title"
      closedby="any"
      onClose={onClose}
      className="w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
        {staffMode ? 'Schedule task' : 'New request'}
      </p>
      <h2 id="sr-form-title" className="mt-2 font-display text-2xl">
        {staffMode ? 'Schedule a Task' : 'Request a Service'}
      </h2>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sr-category" className="mb-1.5 block text-sm font-medium">Category</label>
            <select id="sr-category" name="category" value={values.category} onChange={set} className={fieldClass}>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sr-room" className="mb-1.5 block text-sm font-medium">Room</label>
            <select id="sr-room" name="room" value={values.room} onChange={set} required className={fieldClass}>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>{r.roomNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sr-priority" className="mb-1.5 block text-sm font-medium">Priority</label>
            <select id="sr-priority" name="priority" value={values.priority} onChange={set} className={fieldClass}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{cap(p)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="sr-description" className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            id="sr-description" name="description" rows={3} required maxLength={500}
            value={values.description} onChange={set}
            placeholder="Describe what's needed…"
            className={`${fieldClass} resize-y`}
          />
        </div>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => dialogRef.current?.close()}
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated">
            Cancel
          </button>
          <button type="submit" disabled={isSaving}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

function ChargeCell({ request, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(request.charge ?? 0))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await updateServiceRequest(request._id, { charge: Number(val) })
      onUpdate(updated)
      setEditing(false)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)}
        className="text-left tabular-nums hover:underline">
        {formatPKR(request.charge ?? 0)}
      </button>
    )
  }

  return (
    <span className="flex items-center gap-1">
      <input
        type="number" min="0" step="1" value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-24 rounded-lg border border-line-strong bg-canvas px-2 py-1 text-sm focus:border-accent-strong focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      <button type="button" onClick={save} disabled={saving}
        className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-on-accent disabled:opacity-60">
        {saving ? '…' : 'OK'}
      </button>
      <button type="button" onClick={() => setEditing(false)}
        className="rounded-lg border border-line-strong px-2 py-1 text-xs font-semibold hover:bg-elevated">
        ✕
      </button>
    </span>
  )
}

function Services() {
  const { user } = useAuth()
  const isStaff = STAFF_ROLES.includes(user?.role)

  const [requests, setRequests] = useState([])
  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  const pageRef = useRef(null)
  usePageFade(pageRef)

  const canRequestServices = isStaff || rooms.length > 0

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [reqs, roomSource] = await Promise.all([
        getServiceRequests(),
        isStaff ? getRooms() : getMyBookings(),
      ])
      setRequests(reqs)

      if (isStaff) {
        setRooms(roomSource)
      } else {
        // Guests may only pick rooms from their active bookings.
        const seen = new Set()
        const bookedRooms = []

        for (const booking of roomSource) {
          if (!ACTIVE_BOOKING_STATUSES.includes(booking.status) || !booking.room) continue
          if (seen.has(booking.room._id)) continue
          seen.add(booking.room._id)
          bookedRooms.push(booking.room)
        }

        setRooms(bookedRooms)
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to load service requests.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = isStaff
    ? requests.filter((r) => {
        if (tab === 'housekeeping') return r.category === 'housekeeping'
        if (tab === 'maintenance') return r.category === 'maintenance'
        if (tab === 'guest-services') return GUEST_SERVICE_CATEGORIES.includes(r.category)
        return true
      })
    : requests

  const handleSaved = (saved) => {
    setRequests((prev) => [saved, ...prev])
  }

  const advanceStatus = async (request) => {
    const next = STATUS_NEXT[request.status]
    if (!next) return
    setUpdatingId(request._id)
    setActionError('')
    try {
      const updated = await updateServiceRequest(request._id, { status: next })
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Unable to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleChargeUpdate = (updated) => {
    setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
  }

  return (
    <section ref={pageRef}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Operations</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Services</h1>
          <p className="mt-2 text-sm text-muted">
            {isStaff ? 'Manage guest service requests and housekeeping tasks.' : 'Request additional services for your stay.'}
          </p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          disabled={!canRequestServices}
          title={canRequestServices ? undefined : 'An active booking is required to request services'}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          {isStaff ? 'Schedule Task' : 'Request Service'}
        </button>
      </div>

      {!isStaff && !isLoading && !canRequestServices ? (
        <div className="mt-6 rounded-2xl border border-warning/40 bg-warning-surface p-5 text-sm text-warning">
          <p className="font-semibold">No active booking found</p>
          <p className="mt-1">
            Service requests are available for confirmed or checked-in stays only.{' '}
            <Link to="/rooms" className="font-semibold underline">
              Book a room
            </Link>{' '}
            to get started.
          </p>
        </div>
      ) : null}

      {isStaff ? (
        <div className="mt-6 flex w-fit flex-wrap gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          {STAFF_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-surface text-content shadow-sm' : 'text-muted hover:text-content'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="mt-6 rounded-2xl border border-danger/40 bg-danger-surface p-6 text-sm text-danger">
          <p>{error}</p>
          <button type="button" onClick={load}
            className="mt-3 rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-danger/10">
            Try again
          </button>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium sm:px-6">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Room</th>
                {isStaff ? <th scope="col" className="px-4 py-3 font-medium">Guest</th> : null}
                <th scope="col" className="px-4 py-3 font-medium">Description</th>
                <th scope="col" className="px-4 py-3 font-medium">Priority</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                {isStaff ? <th scope="col" className="px-4 py-3 font-medium">Charge (PKR)</th> : null}
                {isStaff ? <th scope="col" className="px-4 py-3 text-right font-medium sm:px-6">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="border-t border-stone-200 dark:border-slate-800">
                      {Array.from({ length: isStaff ? 8 : 5 }, (_, j) => (
                        <td key={j} className="px-4 py-4 sm:px-6">
                          <div className="h-4 w-20 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : null}

              {!isLoading && filtered.length === 0 ? (
                <tr className="border-t border-stone-200 dark:border-slate-800">
                  <td colSpan={isStaff ? 8 : 5} className="px-6 py-16 text-center">
                    <p className="font-display text-xl">No requests</p>
                    <p className="mt-2 text-sm text-muted">
                      {isStaff ? 'No service requests match this filter.' : 'You have no active service requests.'}
                    </p>
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? filtered.map((r) => {
                    const catLabel = CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category
                    const statusClass = STATUS_BADGE[r.status] ?? 'bg-elevated text-muted'
                    const priorityClass = PRIORITY_BADGE[r.priority] ?? 'bg-elevated text-muted'
                    const nextStatus = STATUS_NEXT[r.status]
                    const isUpdating = updatingId === r._id

                    return (
                      <tr key={r._id} className="border-t border-stone-200 transition-colors hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                        <th scope="row" className="px-4 py-4 font-medium whitespace-nowrap sm:px-6">{catLabel}</th>
                        <td className="px-4 py-4 whitespace-nowrap">{r.room?.roomNumber ?? '—'}</td>
                        {isStaff ? (
                          <td className="px-4 py-4 whitespace-nowrap">{r.requestedBy?.name ?? '—'}</td>
                        ) : null}
                        <td className="px-4 py-4 max-w-[16rem]">
                          <p className="truncate">{r.description}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityClass}`}>
                            {r.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                            {r.status === 'in-progress' ? 'In Progress' : cap(r.status)}
                          </span>
                        </td>
                        {isStaff ? (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <ChargeCell request={r} onUpdate={handleChargeUpdate} />
                          </td>
                        ) : null}
                        {isStaff ? (
                          <td className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                            {nextStatus ? (
                              <button type="button" onClick={() => advanceStatus(r)}
                                disabled={isUpdating}
                                className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-60">
                                {isUpdating ? '…' : `Mark ${nextStatus === 'in-progress' ? 'In Progress' : 'Completed'}`}
                              </button>
                            ) : (
                              <span className="text-xs text-muted">Done</span>
                            )}
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

      {modalOpen ? (
        <RequestFormModal
          rooms={rooms}
          staffMode={isStaff}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </section>
  )
}

export default Services
