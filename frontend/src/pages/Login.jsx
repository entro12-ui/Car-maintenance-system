import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthShell from '../components/AuthShell'
import { LogIn, AlertCircle, Mail, Lock } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(username, password)

    if (result.success) {
      if (result.role === 'Admin') {
        navigate('/')
      } else if (result.role === 'Customer') {
        navigate('/customer/dashboard')
      } else if (result.role === 'Accountant') {
        navigate('/accountant/dashboard')
      } else {
        navigate('/')
      }
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <AuthShell showHero>
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white shadow-lg shadow-primary/25">
          CS
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to Car Service Management
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/95 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <div>
          <label htmlFor="login-email" className="ui-label">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/70"
              aria-hidden
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="ui-field pl-11"
              placeholder="you@company.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="ui-label">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/70"
              aria-hidden
            />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="ui-field pl-11"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:from-primary-500 hover:to-primary-600 hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <LogIn className="h-5 w-5 opacity-90" aria-hidden />
          <span>{loading ? 'Signing in…' : 'Sign in'}</span>
        </button>
      </form>

      <div className="mt-8 space-y-3 border-t border-border/60 pt-8 text-center text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-700 underline-offset-4 hover:text-primary-600 hover:underline"
          >
            Register as customer
          </Link>
        </p>
        <p>
          Accountant?{' '}
          <Link
            to="/register-accountant"
            className="font-semibold text-primary-700 underline-offset-4 hover:text-primary-600 hover:underline"
          >
            Create accountant access
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
