import React from 'react'
import { Button } from '@/components/ui/button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-mesh relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <div className="pointer-events-none absolute inset-0 auth-mesh-glow opacity-70" aria-hidden />
          <div className="glass-auth-card relative z-10 max-w-md rounded-2xl p-10 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <span className="font-display text-2xl font-bold">!</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred. You can try signing in again.'}
            </p>
            <Button
              className="mt-8 w-full"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/login'
              }}
            >
              Go to login
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
