import { useAuth } from '../context/AuthContext.jsx'

function Home() {
  const { user } = useAuth()

  return (
    <section>
      <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
        Dashboard
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
        Welcome back, {user?.name}
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        You are signed in as {user?.role}. Rooms and bookings will appear here as we build
        them out.
      </p>
    </section>
  )
}

export default Home
