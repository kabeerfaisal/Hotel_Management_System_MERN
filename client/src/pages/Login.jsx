import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import AuthShell from '../components/auth/AuthShell.jsx'
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal.jsx'
import PasswordInput from '../components/auth/PasswordInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useHeroFadeUp } from '../hooks/useLuxuryAnimations.js'

const inputClassName =
  'w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500'

function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isForgotOpen, setIsForgotOpen] = useState(false)

  const formScopeRef = useRef(null)
  useHeroFadeUp(formScopeRef)

  const redirectTo = location.state?.from?.pathname ?? '/'

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? 'Unable to sign in. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      quote="Arrive as a guest, leave as family."
      attribution="The LuxuryStay Concierge"
    >
      <div ref={formScopeRef}>
        <div data-hero-animate className="mb-6 lg:hidden">
          <p className="font-display text-2xl tracking-tight text-amber-700 dark:text-amber-300">
            LuxuryStay
          </p>
          <p className="mt-1 text-[0.6rem] font-semibold tracking-[0.28em] text-slate-500 uppercase dark:text-slate-400">
            Five-star hospitality
          </p>
        </div>

        <section className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-xl backdrop-blur sm:p-8 dark:border-amber-500/15 dark:bg-slate-900/80">
          <p
            data-hero-animate
            className="text-[0.65rem] font-semibold tracking-[0.24em] text-amber-700 uppercase dark:text-amber-400"
          >
            Guest concierge · Staff portal
          </p>
          <h1 data-hero-animate className="mt-3 font-display text-3xl">
            Welcome back
          </h1>
          <p
            data-hero-animate
            className="mt-2 text-sm text-slate-600 dark:text-slate-400"
          >
            Sign in to manage your stays or your hotel operations.
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <form data-hero-animate onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@luxurystay.com"
                className={inputClassName}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                inputClassName={inputClassName}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            New to LuxuryStay?{' '}
            <Link
              to="/register"
              className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
            >
              Create an account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-[0.65rem] font-medium tracking-[0.2em] text-slate-500 uppercase dark:text-slate-500">
          LuxuryStay Hospitality · Secure access
        </p>
      </div>

      {isForgotOpen ? (
        <ForgotPasswordModal
          initialEmail={email}
          onClose={() => setIsForgotOpen(false)}
        />
      ) : null}
    </AuthShell>
  )
}

export default Login
