const navigation = [
  { label: 'Stay', href: '#stay' },
  { label: 'Dining', href: '#dining' },
  { label: 'Experiences', href: '#experiences' },
  { label: 'Contact', href: '#contact' },
]

const foundation = [
  { label: 'Client', value: 'React 19 · Vite' },
  { label: 'Styling', value: 'Tailwind CSS v4' },
  { label: 'API', value: 'Express 5 · Modular' },
  { label: 'Data', value: 'MongoDB · Mongoose' },
]

// Evaluated once at module scope — keeps render pure.
const currentYear = new Date().getFullYear()

function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <a href="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tight">LuxuryStay</span>
            <span className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
              Hospitality
            </span>
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-content"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="#foundation"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
          >
            Book a stay
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section
          id="stay"
          className="mx-auto grid w-full max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28"
        >
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-medium tracking-[0.18em] text-muted uppercase">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
              Phase 01 — Foundation
            </p>

            <h1 className="max-w-xl font-display text-5xl leading-[1.05] text-balance sm:text-6xl">
              Quiet luxury, orchestrated.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              A hotel management platform for reservations, rooms, guests, and billing —
              built to run an entire property from one calm interface.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#foundation"
                className="rounded-full bg-content px-6 py-3 text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                Explore the build
              </a>
              <a
                href="/api/health"
                className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold transition-colors hover:bg-elevated"
              >
                API status
              </a>
            </div>
          </div>

          <aside
            id="foundation"
            aria-labelledby="foundation-heading"
            className="rounded-3xl border border-line bg-surface p-7 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="foundation-heading" className="font-display text-2xl">
                System foundation
              </h2>
              <span className="rounded-full bg-elevated px-3 py-1 text-xs font-medium text-muted">
                Ready
              </span>
            </div>

            <dl className="mt-6 divide-y divide-line">
              {foundation.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-muted">{item.label}</dt>
                  <dd className="text-right text-sm font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">
              Health probe available at{' '}
              <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[0.7rem]">
                GET /api/health
              </code>
            </p>
          </aside>
        </section>
      </main>

      <footer id="contact" className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} LuxuryStay Hospitality</p>
          <p>React · Express · MongoDB</p>
        </div>
      </footer>
    </div>
  )
}

export default App
