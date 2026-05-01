import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api'
import AuthShell from '../components/AuthShell'
import { CheckCircle, XCircle, Calculator } from 'lucide-react'

export default function RegisterAccountant() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      await authApi.registerAccountant({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: formData.address || null,
        city: formData.city || null,
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (success) {
    return (
      <AuthShell cardClassName="max-w-md">
        <div className="py-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="text-emerald-600" size={40} strokeWidth={2} aria-hidden />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Application received</h2>
          <p className="mt-3 text-muted-foreground">
            Your accountant profile is pending admin approval. You can sign in once it&apos;s activated.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-700"
          >
            Go to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell cardClassName="max-w-lg">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary-700">
          <Calculator className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Accountant registration
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Or{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-700 underline-offset-4 hover:text-primary-600 hover:underline"
          >
            sign in to your account
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/95 px-4 py-3 text-sm text-red-800"
          >
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="acc-first_name" className="ui-label">
              First name *
            </label>
            <input
              id="acc-first_name"
              name="first_name"
              type="text"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="ui-field"
              placeholder="First name"
            />
          </div>
          <div>
            <label htmlFor="acc-last_name" className="ui-label">
              Last name *
            </label>
            <input
              id="acc-last_name"
              name="last_name"
              type="text"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="ui-field"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="acc-email" className="ui-label">
            Email *
          </label>
          <input
            id="acc-email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="ui-field"
            placeholder="Email address"
          />
        </div>

        <div>
          <label htmlFor="acc-phone" className="ui-label">
            Phone *
          </label>
          <input
            id="acc-phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className="ui-field"
            placeholder="Phone number"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="acc-address" className="ui-label">
              Address
            </label>
            <input
              id="acc-address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              className="ui-field"
              placeholder="Address"
            />
          </div>
          <div>
            <label htmlFor="acc-city" className="ui-label">
              City
            </label>
            <input
              id="acc-city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              className="ui-field"
              placeholder="City"
            />
          </div>
        </div>

        <div>
          <label htmlFor="acc-password" className="ui-label">
            Password *
          </label>
          <input
            id="acc-password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="ui-field"
            placeholder="Min. 6 characters"
          />
        </div>

        <div>
          <label htmlFor="acc-confirmPassword" className="ui-label">
            Confirm password *
          </label>
          <input
            id="acc-confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="ui-field"
            placeholder="Confirm password"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:from-primary-500 hover:to-primary-600"
        >
          Submit registration
        </button>
      </form>
    </AuthShell>
  )
}
