import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import AuthShell from '../components/auth/AuthShell.jsx'
import PasswordInput from '../components/auth/PasswordInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useHeroFadeUp } from '../hooks/useLuxuryAnimations.js'

const inputClassName =
  'w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500'

function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      })
      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? 'Unable to create your account. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      quote="A quiet retreat, thoughtfully yours."
      attribution="LuxuryStay Hospitality"
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
            Guest membership
          </p>
          <h1 data-hero-animate className="mt-3 font-display text-3xl">
            Create an account
          </h1>
          <p
            data-hero-animate
            className="mt-2 text-sm text-slate-600 dark:text-slate-400"
          >
            Join the LuxuryStay concierge and reserve your next escape.
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
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
                className={inputClassName}
              />
            </div>

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
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                inputClassName={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                Phone{' '}
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  (optional)
                </span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555 010 0100"
                className={inputClassName}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
            >
              Sign in
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-[0.65rem] font-medium tracking-[0.2em] text-slate-500 uppercase dark:text-slate-500">
          LuxuryStay Hospitality · Curated stays
        </p>
      </div>
    </AuthShell>
  )
}

export default Register
