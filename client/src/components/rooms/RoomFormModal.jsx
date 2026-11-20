import { useEffect, useState } from 'react'

const ROOM_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
]

const fieldClassName =
  'w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong'

function buildInitialValues(room) {
  return {
    roomNumber: room?.roomNumber ?? '',
    type: room?.type ?? '',
    pricePerNight: room?.pricePerNight ?? '',
    status: room?.status ?? 'available',
    amenities: room?.amenities?.join(', ') ?? '',
    description: room?.description ?? '',
  }
}

function RoomFormModal({ room, onClose, onSubmit }) {
  const [values, setValues] = useState(() => buildInitialValues(room))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = Boolean(room)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await onSubmit({
        roomNumber: values.roomNumber.trim(),
        type: values.type.trim(),
        pricePerNight: Number(values.pricePerNight),
        status: values.status,
        amenities: values.amenities
          .split(',')
          .map((amenity) => amenity.trim())
          .filter((amenity) => amenity.length > 0),
        description: values.description.trim(),
      })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to save this room. Please try again.',
      )
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/50"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-form-title"
        className="relative my-8 w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-xl"
      >
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {isEditing ? 'Room details' : 'New room'}
        </p>
        <h2 id="room-form-title" className="mt-2 font-display text-2xl">
          {isEditing ? `Edit room ${room.roomNumber}` : 'Add a room'}
        </h2>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="roomNumber" className="mb-1.5 block text-sm font-medium">
                Room number
              </label>
              <input
                id="roomNumber"
                name="roomNumber"
                type="text"
                required
                maxLength={10}
                autoFocus
                value={values.roomNumber}
                onChange={handleChange}
                placeholder="101"
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-medium">
                Type
              </label>
              <input
                id="type"
                name="type"
                type="text"
                required
                maxLength={40}
                value={values.type}
                onChange={handleChange}
                placeholder="Deluxe King"
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="pricePerNight"
                className="mb-1.5 block text-sm font-medium"
              >
                Price per night
              </label>
              <input
                id="pricePerNight"
                name="pricePerNight"
                type="number"
                required
                min="0"
                step="0.01"
                value={values.pricePerNight}
                onChange={handleChange}
                placeholder="199"
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={values.status}
                onChange={handleChange}
                className={fieldClassName}
              >
                {ROOM_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="amenities" className="mb-1.5 block text-sm font-medium">
              Amenities
            </label>
            <input
              id="amenities"
              name="amenities"
              type="text"
              value={values.amenities}
              onChange={handleChange}
              placeholder="Wi-Fi, Minibar, Ocean view"
              className={fieldClassName}
            />
            <p className="mt-1.5 text-xs text-muted">Separate amenities with commas.</p>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              value={values.description}
              onChange={handleChange}
              placeholder="Corner suite with a private balcony."
              className={`${fieldClassName} resize-y`}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Create room'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default RoomFormModal
