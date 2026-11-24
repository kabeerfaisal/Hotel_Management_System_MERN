import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../context/AuthContext.jsx'
import { usePageFade } from '../hooks/useLuxuryAnimations.js'
import { createFeedback, getFeedback } from '../services/feedbackService.js'

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' }

const STATUS_BADGE_FOR_RATING = (rating) => {
  if (rating >= 4) return 'bg-success-surface text-success'
  if (rating >= 3) return 'bg-warning-surface text-warning'
  return 'bg-danger-surface text-danger'
}

function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hovered || value) >= star ? 'text-warning' : 'text-line-strong'}>
            ★
          </span>
        </button>
      ))}
      {value ? (
        <span className="ml-2 self-center text-sm text-muted">{RATING_LABELS[value]}</span>
      ) : null}
    </div>
  )
}

function Feedback() {
  const { user } = useAuth()
  const isStaff = STAFF_ROLES.includes(user?.role)

  const [feedback, setFeedback] = useState([])
  const [averageRating, setAverageRating] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const pageRef = useRef(null)
  usePageFade(pageRef)

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getFeedback()
      setFeedback(result.feedback)
      if (result.averageRating !== null) setAverageRating(result.averageRating)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to load feedback.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) { setFormError('Please select a star rating.'); return }
    if (!comment.trim()) { setFormError('Please enter a comment.'); return }
    setFormError('')
    setIsSubmitting(true)
    try {
      const saved = await createFeedback({ rating, comment: comment.trim() })
      setFeedback((prev) => [saved, ...prev])
      setRating(0)
      setComment('')
      setSubmitted(true)
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Unable to submit feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isStaff) {
    return (
      <section ref={pageRef}>
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Insights</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Guest Feedback</h1>
          <p className="mt-2 text-sm text-muted">All reviews submitted by guests.</p>
        </div>

        {!isLoading && averageRating !== null ? (
          <div className="mt-8 inline-flex flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Average Rating</p>
            <p className="mt-2 font-display text-5xl tracking-tight tabular-nums">
              {averageRating.toFixed(1)}
              <span className="ml-2 text-warning text-4xl">★</span>
            </p>
            <p className="mt-1 text-sm text-muted">Based on {feedback.length} review{feedback.length !== 1 ? 's' : ''}</p>
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

        <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-elevated/60 text-xs tracking-[0.14em] text-muted uppercase dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-6">Guest</th>
                  <th scope="col" className="px-4 py-3 font-medium">Rating</th>
                  <th scope="col" className="px-4 py-3 font-medium">Comment</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 3 }, (_, i) => (
                      <tr key={i} className="border-t border-stone-200 dark:border-slate-800">
                        {Array.from({ length: 4 }, (_, j) => (
                          <td key={j} className="px-4 py-4 sm:px-6">
                            <div className="h-4 w-20 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}

                {!isLoading && feedback.length === 0 ? (
                  <tr className="border-t border-stone-200 dark:border-slate-800">
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <p className="font-display text-xl">No reviews yet</p>
                      <p className="mt-2 text-sm text-muted">Guest feedback will appear here.</p>
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? feedback.map((f) => (
                      <tr key={f._id} className="border-t border-stone-200 transition-colors hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                        <th scope="row" className="px-4 py-4 font-medium whitespace-nowrap sm:px-6">
                          {f.guest?.name ?? '—'}
                        </th>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_FOR_RATING(f.rating)}`}>
                            {f.rating} <span className="text-warning">★</span>
                          </span>
                        </td>
                        <td className="px-4 py-4 max-w-[22rem]">
                          <p className="line-clamp-2 text-sm">{f.comment}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted">
                          {new Date(f.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={pageRef}>
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Your Voice</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Leave Feedback</h1>
        <p className="mt-2 text-sm text-muted">Share your experience with us.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {submitted ? (
          <div className="text-center py-6">
            <p className="font-display text-2xl">Thank you! 🙏</p>
            <p className="mt-2 text-sm text-muted">Your feedback has been recorded.</p>
            <button type="button" onClick={() => setSubmitted(false)}
              className="mt-4 rounded-full border border-line-strong px-5 py-2 text-sm font-semibold transition-colors hover:bg-elevated">
              Submit another review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Your rating</p>
              <StarSelector value={rating} onChange={setRating} />
            </div>
            <div>
              <label htmlFor="fb-comment" className="mb-1.5 block text-sm font-medium">Your comment</label>
              <textarea
                id="fb-comment" rows={4} required maxLength={1000}
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your stay…"
                className="w-full resize-y rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-content transition-colors placeholder:text-muted focus:border-accent-strong focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            {formError ? (
              <p role="alert" className="rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger">
                {formError}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Submitting…' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>

      {feedback.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-2xl">Your Reviews</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {feedback.map((f) => (
              <article key={f._id} className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_FOR_RATING(f.rating)}`}>
                    {f.rating} <span className="text-warning">★</span> — {RATING_LABELS[f.rating]}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(f.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="mt-3 text-sm">{f.comment}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {!isLoading && feedback.length === 0 && !submitted ? (
        <p className="mt-8 text-center text-sm text-muted">You haven't submitted any reviews yet.</p>
      ) : null}
    </section>
  )
}

export default Feedback
