function Placeholder({ title }) {
  return (
    <section>
      <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
        Coming soon
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        This module is next on the build plan. The dashboard layout is already wired up
        around it.
      </p>
    </section>
  )
}

export default Placeholder
