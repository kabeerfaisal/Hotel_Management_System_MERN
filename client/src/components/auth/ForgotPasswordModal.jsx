import { useEffect, useState } from 'react'

import PasswordInput from './PasswordInput.jsx'
import { forgotPassword, resetPassword } from '../../services/authService.js'

const inputClassName =
  'w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500'

function extractError(requestError, fallback) {
  return requestError.response?.data?.message ?? fallback
}

/**
 * Two-step password reset: request a 6-digit code by email, then set a new
 * password.
 */
function ForgotPasswordModal({ initialEmail = '', onClose }) {
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleRequestCode = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setError('Enter the email associated with your account.')
      return
    }

    setIsSubmitting(true)

    try {
      const data = await forgotPassword(normalizedEmail)
      setNotice(
        data.message ??
          'If an account with that email exists, a 6-digit reset code has been sent to your registered email.',
      )
      setStep('reset')
    } catch (requestError) {
      setError(
        extractError(requestError, 'Unable to send a reset code. Please try again.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit reset code.')
      return
    }

    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      const data = await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      })
      setNotice(data.message ?? 'Password reset successfully.')
      setStep('done')
    } catch (requestError) {
      setError(
        extractError(requestError, 'Unable to reset your password. Please try again.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close password reset"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 text-slate-900 shadow-2xl sm:p-8 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="size-4"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {step === 'done' ? (
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
              Password updated
            </p>
            <h2 id="forgot-password-title" className="mt-2 font-display text-2xl">
              You&apos;re all set
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{notice}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
              {step === 'request' ? 'Account recovery' : 'Verify your code'}
            </p>
            <h2 id="forgot-password-title" className="mt-2 font-display text-2xl">
              {step === 'request' ? 'Forgot password?' : 'Set a new password'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {step === 'request'
                ? 'Enter your account email and we will send a 6-digit reset code valid for 15 minutes.'
                : `Enter the code sent to ${email.trim()} and choose a new password.`}
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}

            {notice ? (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                <p>{notice}</p>
                <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/70">
                  Check your registered inbox and spam folder for the 6-digit code. It
                  expires in 15 minutes.
                </p>
              </div>
            ) : null}

            {step === 'request' ? (
              <form onSubmit={handleRequestCode} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="reset-email" className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@luxurystay.com"
                    className={inputClassName}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  {isSubmitting ? 'Generating code…' : 'Send reset code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="reset-code" className="mb-2 block text-sm font-medium">
                    Reset code
                  </label>
                  <input
                    id="reset-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="123456"
                    className={`${inputClassName} tracking-[0.3em]`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    New password
                  </label>
                  <PasswordInput
                    id="reset-password"
                    name="newPassword"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    inputClassName={inputClassName}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  {isSubmitting ? 'Resetting…' : 'Reset password'}
                </button>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request')
                      setError('')
                      setNotice('')
                    }}
                    className="text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRequestCode}
                    className="font-semibold text-amber-700 underline-offset-4 hover:underline disabled:opacity-60 dark:text-amber-400"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default ForgotPasswordModal
