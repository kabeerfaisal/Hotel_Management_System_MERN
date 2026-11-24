import { useEffect, useRef, useState } from 'react'

import { usePageFade } from '../hooks/useLuxuryAnimations.js'
import { getSettings, updateSettings } from '../services/settingService.js'

const fieldClass =
  'w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500'

const DEFAULT_VALUES = {
  hotelName: '',
  taxRate: 10,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  cancellationPolicy: '',
}

function Settings() {
  const [values, setValues] = useState(DEFAULT_VALUES)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const pageRef = useRef(null)
  usePageFade(pageRef)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const settings = await getSettings()
        if (cancelled) return
        setValues({
          hotelName: settings.hotelName ?? '',
          taxRate: settings.taxRate ?? 10,
          checkInTime: settings.checkInTime ?? '14:00',
          checkOutTime: settings.checkOutTime ?? '12:00',
          cancellationPolicy: settings.cancellationPolicy ?? '',
        })
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ??
              'Unable to load settings. Please try again.',
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setSavedMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSavedMessage('')

    try {
      const settings = await updateSettings({
        ...values,
        taxRate: Number(values.taxRate),
      })
      setValues({
        hotelName: settings.hotelName ?? '',
        taxRate: settings.taxRate ?? 10,
        checkInTime: settings.checkInTime ?? '14:00',
        checkOutTime: settings.checkOutTime ?? '12:00',
        cancellationPolicy: settings.cancellationPolicy ?? '',
      })
      setSavedMessage('Settings saved successfully.')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to save settings. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section ref={pageRef} className="max-w-3xl">
      <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
        Administration
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Hotel identity, tax, and front-desk policies used across invoices and bookings.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {savedMessage ? (
        <p
          role="status"
          className="mt-6 rounded-xl border border-success/40 bg-success-surface px-4 py-3 text-sm text-success"
        >
          {savedMessage}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-muted">Loading settings…</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <label htmlFor="hotelName" className="mb-1.5 block text-sm font-medium">
              Hotel name
            </label>
            <input
              id="hotelName"
              name="hotelName"
              type="text"
              required
              maxLength={100}
              value={values.hotelName}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="taxRate" className="mb-1.5 block text-sm font-medium">
                Tax rate (%)
              </label>
              <input
                id="taxRate"
                name="taxRate"
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                value={values.taxRate}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="checkInTime" className="mb-1.5 block text-sm font-medium">
                Check-in time
              </label>
              <input
                id="checkInTime"
                name="checkInTime"
                type="time"
                required
                value={values.checkInTime}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="checkOutTime" className="mb-1.5 block text-sm font-medium">
                Check-out time
              </label>
              <input
                id="checkOutTime"
                name="checkOutTime"
                type="time"
                required
                value={values.checkOutTime}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cancellationPolicy" className="mb-1.5 block text-sm font-medium">
              Cancellation policy
            </label>
            <textarea
              id="cancellationPolicy"
              name="cancellationPolicy"
              rows={4}
              maxLength={1000}
              value={values.cancellationPolicy}
              onChange={handleChange}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default Settings
