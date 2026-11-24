const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80'

/**
 * Split-screen shell for the public auth pages.
 * Left: full-height luxury imagery + brand quote (desktop only).
 * Right: themed form slot.
 */
function AuthShell({ quote, attribution, children }) {
  return (
    <main className="grid min-h-dvh bg-canvas text-content lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden min-h-dvh overflow-hidden bg-slate-950 lg:block">
        <img
          src={AUTH_IMAGE}
          alt="Luxury resort pool at dusk"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/65 to-amber-950/50" />

        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <div>
            <p className="font-display text-2xl tracking-tight text-amber-200">
              LuxuryStay
            </p>
            <p className="mt-1 text-[0.6rem] font-semibold tracking-[0.3em] text-white/60 uppercase">
              Five-star hospitality
            </p>
          </div>

          <figure className="max-w-md">
            <blockquote className="font-display text-3xl leading-snug xl:text-4xl">
              “{quote}”
            </blockquote>
            <figcaption className="mt-5 text-xs font-semibold tracking-[0.22em] text-amber-300 uppercase">
              {attribution}
            </figcaption>
          </figure>

          <p className="text-[0.65rem] tracking-[0.28em] text-white/50 uppercase">
            Karachi · Lahore · Islamabad
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:py-16">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}

export default AuthShell
