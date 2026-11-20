import { Route, Routes } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'

function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <h1 className="text-center font-display text-4xl font-semibold tracking-tight text-content sm:text-5xl">
        Welcome to LuxuryStay
      </h1>
    </main>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
