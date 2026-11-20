import { useState } from 'react'

import { useAuth } from '../context/AuthContext.jsx'

export default function BookingModal({ onClose, initialRoom }) {
  const { user } = useAuth()
  const [formState, setFormState] = useState({
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  })
  const [error, setError] = useState('')
  const [totalPrice, setTotalPrice] = useState(0)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const checkIn = new Date(formState.checkIn)
    const checkOut = new Date(formState.checkOut)

    if (checkOut <= checkIn) {
      setError('Check-out date must be after check-in date')
      return
    }

    const nights = (checkOut - checkIn) / (86400000)
    setTotalPrice(Math.round(nights * (initialRoom?.pricePerNight ?? 0) * 100) / 100)

    try {
      await window.bookingService.createBooking({
        room: initialRoom._id,
        checkInDate: formState.checkIn,
        checkOutDate: formState.checkOut,
        user: user?.id,
      })
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to create booking. Please try again.',
      )
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
        aria-labelledby="booking-modal-title"
        className="relative my-8 w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-xl"
      >
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          New booking
        </p>
        <h2 id="booking-modal-title" className="mt-2 font-display text-2xl">
          Book room {initialRoom?.roomNumber}
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
          <div>
            <label htmlFor="checkIn" className="mb-1.5 block text-sm font-medium">
              Check-in date
            </label>
            <input
              id="checkIn"
              name="checkIn"
              type="date"
              required
              min={formState.checkIn}
              value={formState.checkIn}
              onChange={(e) => setFormState((prev) => ({ ...prev, checkIn: e.target.value }))}
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
              min={formState.checkIn}
              value={formState.checkOut}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, checkOut: e.target.value }))
              }
              className="w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong"
            />
          </div>

          {totalPrice > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {formatPKR(totalPrice)} for {Math.round(
                (86400000 > 0 ? 1 : (new Date(formState.checkOut) - new Date(formState.checkIn)) / 86400000),
                0,
              )} night(s)
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!error}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {error ? 'Try again' : 'Book now'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}