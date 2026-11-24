import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../context/AuthContext.jsx'
import { usePageFade } from '../hooks/useLuxuryAnimations.js'
import {
  createUser,
  getUsers,
  toggleUserStatus,
  updateUser,
} from '../services/userService.js'

const ALL_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'guest']
const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping']
const GUEST_ROLES = ['guest']

const ROLE_BADGES = {
  admin: 'bg-danger-surface text-danger',
  manager: 'bg-warning-surface text-warning',
  receptionist: 'bg-info-surface text-info',
  housekeeping: 'bg-elevated text-muted',
  guest: 'bg-success-surface text-success',
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'staff', label: 'Staff' },
  { key: 'guests', label: 'Guests' },
]

const fieldClass =
  'w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500'

function buildEmpty(mode) {
  return {
    name: '',
    email: '',
    password: '',
    role: mode === 'guest' ? 'guest' : 'receptionist',
    phone: '',
    preferences: '',
  }
}

function UserFormModal({ user, onClose, onSaved }) {
  const isEditing = Boolean(user)
  const dialogRef = useRef(null)
  const [values, setValues] = useState(
    isEditing
      ? {
          name: user.name ?? '',
          email: user.email ?? '',
          password: '',
          role: user.role ?? 'guest',
          phone: user.phone ?? '',
          preferences: user.preferences ?? '',
        }
      : buildEmpty('staff'),
  )
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
      const payload = {
        name: values.name.trim(),
        role: values.role,
        phone: values.phone.trim(),
        preferences: values.preferences.trim(),
      }
      if (!isEditing) {
        payload.email = values.email.trim()
        payload.password = values.password
      } else if (values.password) {
        payload.password = values.password
      }

      const saved = isEditing ? await updateUser(user._id, payload) : await createUser(payload)
      onSaved(saved, isEditing)
      dialogRef.current?.close()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to save. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="user-form-title"
      closedby="any"
      onClose={onClose}
      className="w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
        {isEditing ? 'Edit user' : 'New user'}
      </p>
      <h2 id="user-form-title" className="mt-2 font-display text-2xl">
        {isEditing ? `Edit ${user.name}` : 'Add a user'}
      </h2>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="uf-name" className="mb-1.5 block text-sm font-medium">Name</label>
            <input id="uf-name" name="name" type="text" required autoFocus maxLength={80}
              value={values.name} onChange={set} placeholder="Jane Doe" className={fieldClass} />
          </div>

          {!isEditing ? (
            <div>
              <label htmlFor="uf-email" className="mb-1.5 block text-sm font-medium">Email</label>
              <input id="uf-email" name="email" type="email" required
                value={values.email} onChange={set} placeholder="jane@example.com" className={fieldClass} />
            </div>
          ) : null}

          <div>
            <label htmlFor="uf-role" className="mb-1.5 block text-sm font-medium">Role</label>
            <select id="uf-role" name="role" value={values.role} onChange={set} className={fieldClass}>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="uf-phone" className="mb-1.5 block text-sm font-medium">Phone</label>
            <input id="uf-phone" name="phone" type="text" maxLength={20}
              value={values.phone} onChange={set} placeholder="+92 300 1234567" className={fieldClass} />
          </div>
        </div>

        <div>
          <label htmlFor="uf-preferences" className="mb-1.5 block text-sm font-medium">
            Preferences <span className="text-muted">(guest notes)</span>
          </label>
          <textarea id="uf-preferences" name="preferences" rows={2} maxLength={500}
            value={values.preferences} onChange={set}
            placeholder="Non-smoking, high floor, extra towels…"
            className={`${fieldClass} resize-y`} />
        </div>

        <div>
          <label htmlFor="uf-password" className="mb-1.5 block text-sm font-medium">
            {isEditing ? 'New password' : 'Password'}{' '}
            {isEditing ? <span className="text-muted">(leave blank to keep current)</span> : null}
          </label>
          <input id="uf-password" name="password" type="password"
            required={!isEditing} minLength={8}
            value={values.password} onChange={set}
            placeholder={isEditing ? '••••••••' : 'Min 8 characters'}
            className={fieldClass} />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => dialogRef.current?.close()}
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated">
            Cancel
          </button>
          <button type="submit" disabled={isSaving}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

function Users() {
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [tab, setTab] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const pageRef = useRef(null)
  usePageFade(pageRef)

  if (currentUser?.role !== 'admin') {
    return (
      <section ref={pageRef} className="py-12">
        <h1 className="font-display text-3xl tracking-tight">Users</h1>
        <p className="mt-4 text-sm text-muted">Admin access required.</p>
      </section>
    )
  }

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      setUsers(await getUsers())
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to load users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { load() }, [])

  const filtered = users.filter((u) => {
    if (tab === 'staff') return STAFF_ROLES.includes(u.role)
    if (tab === 'guests') return GUEST_ROLES.includes(u.role)
    return true
  })

  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (u) => { setEditTarget(u); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditTarget(null) }

  const handleSaved = (saved, isEditing) => {
    setUsers((prev) =>
      isEditing ? prev.map((u) => (u._id === saved._id ? saved : u)) : [saved, ...prev],
    )
    setActionError('')
  }

  const handleToggle = async (u) => {
    if (u._id === currentUser?.id) {
      setActionError('You cannot deactivate your own account.')
      return
    }
    setTogglingId(u._id)
    setActionError('')
    try {
      const updated = await toggleUserStatus(u._id)
      setUsers((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Unable to update status.')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section ref={pageRef}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Management</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Users</h1>
          <p className="mt-2 text-sm text-muted">{users.length} {users.length === 1 ? 'user' : 'users'} total</p>
        </div>
        <button type="button" onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add user
        </button>
      </div>

      <div className="mt-6 flex w-fit gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-surface text-content shadow-sm' : 'text-muted hover:text-content'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

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
        <p role="alert" className="mt-6 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium sm:px-6">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Phone / Preferences</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="border-t border-stone-200 dark:border-slate-800">
                      {Array.from({ length: 6 }, (_, j) => (
                        <td key={j} className="px-4 py-4 sm:px-6">
                          <div className="h-4 w-20 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : null}

              {!isLoading && filtered.length === 0 ? (
                <tr className="border-t border-stone-200 dark:border-slate-800">
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="font-display text-xl">No users</p>
                    <p className="mt-2 text-sm text-muted">No users match this filter.</p>
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? filtered.map((u) => {
                    const badgeClass = ROLE_BADGES[u.role] ?? 'bg-elevated text-muted'
                    const isToggling = togglingId === u._id
                    const isSelf = u._id === currentUser?.id

                    return (
                      <tr key={u._id} className="border-t border-stone-200 transition-colors hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                        <th scope="row" className="px-4 py-4 font-medium whitespace-nowrap sm:px-6">
                          {u.name}
                          {isSelf ? <span className="ml-2 text-xs text-muted">(you)</span> : null}
                        </th>
                        <td className="px-4 py-4 text-muted whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 max-w-[14rem]">
                          {u.phone ? <p className="truncate text-sm">{u.phone}</p> : null}
                          {u.preferences ? (
                            <p className="truncate text-xs text-muted mt-0.5">{u.preferences}</p>
                          ) : null}
                          {!u.phone && !u.preferences ? <span className="text-muted">—</span> : null}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.isActive !== false
                              ? 'bg-success-surface text-success'
                              : 'bg-danger-surface text-danger'
                          }`}>
                            {u.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openEdit(u)}
                              className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-elevated">
                              Edit
                            </button>
                            <button type="button" onClick={() => handleToggle(u)}
                              disabled={isToggling || isSelf}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                u.isActive !== false
                                  ? 'border-danger/40 text-danger hover:bg-danger/10'
                                  : 'border-success/40 text-success hover:bg-success/10'
                              }`}>
                              {isToggling ? '…' : u.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <UserFormModal user={editTarget} onClose={closeModal} onSaved={handleSaved} />
      ) : null}
    </section>
  )
}

export default Users
