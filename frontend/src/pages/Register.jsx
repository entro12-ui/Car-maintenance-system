import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthShell from '../components/AuthShell'
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await register(formData)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <AuthShell cardClassName="max-w-md">
        <div className="py-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="text-emerald-600" size={40} strokeWidth={2} aria-hidden />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">You&apos;re all set</h2>
          <p className="mt-3 text-muted-foreground">
            Your account was created and is pending admin approval. We&apos;ll send you to sign in…
          </p>
          <p className="mt-6 text-xs text-muted-foreground">Redirecting to login</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell cardClassName="max-w-lg">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary-700">
          <UserPlus className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join as a customer — approval required before first login
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/95 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-first" className="ui-label">
              First name
            </label>
            <input
              id="reg-first"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="ui-field"
            />
          </div>
          <div>
            <label htmlFor="reg-last" className="ui-label">
              Last name
            </label>
            <input
              id="reg-last"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="ui-field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="ui-label">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="ui-field"
          />
        </div>

        <div>
          <label htmlFor="reg-phone" className="ui-label">
            Phone
          </label>
          <input
            id="reg-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="ui-field"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="ui-label">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="ui-field"
          />
        </div>

        <div>
          <label htmlFor="reg-address" className="ui-label">
            Address
          </label>
          <textarea
            id="reg-address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            className="ui-field resize-y min-h-[5rem]"
          />
        </div>

        <div>
          <label htmlFor="reg-city" className="ui-label">
            City
          </label>
          <input
            id="reg-city"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="ui-field"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:from-primary-500 hover:to-primary-600 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <UserPlus className="h-5 w-5" aria-hidden />
          <span>{loading ? 'Submitting…' : 'Create account'}</span>
        </button>
      </form>

      <p className="mt-8 border-t border-border/60 pt-8 text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary-700 underline-offset-4 hover:text-primary-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
