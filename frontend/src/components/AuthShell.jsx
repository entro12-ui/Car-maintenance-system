import { Sparkles, Shield, Gauge } from 'lucide-react'

/**
 * Shared layout for login/register surfaces — mesh background, glass card, optional hero panel.
 */
export default function AuthShell({
  children,
  showHero = false,
  cardClassName = 'max-w-md',
}) {
  return (
    <div className="relative min-h-screen overflow-hidden auth-mesh">
      <div className="pointer-events-none absolute inset-0 auth-mesh-grid opacity-[0.35]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 auth-mesh-glow" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {showHero ? (
          <aside className="relative hidden min-h-[220px] flex-1 flex-col justify-between overflow-hidden px-10 py-14 text-white lg:flex lg:max-w-[min(520px,42vw)] lg:min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-teal-800" aria-hidden />
            <div
              className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-teal-400/25 blur-3xl"
              aria-hidden
            />
            <div
              className="absolute -bottom-16 left-1/4 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
              aria-hidden
            />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-50 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Workshop intelligence
              </div>
              <h2 className="font-display text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
                Precision service.
                <span className="block text-teal-100">Effortless operations.</span>
              </h2>
              <p className="max-w-sm text-base leading-relaxed text-teal-50/90">
                One workspace for job orders, invoicing, and customer care — built for teams who care
                about every vehicle that rolls through the bay.
              </p>
            </div>

            <ul className="relative z-10 mt-12 space-y-4 text-sm text-teal-50/95">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <Shield className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <strong className="font-semibold text-white">Role-aware access</strong>
                  <span className="block text-teal-100/85">Admin, staff, and customer flows stay cleanly separated.</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <Gauge className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <strong className="font-semibold text-white">Built for throughput</strong>
                  <span className="block text-teal-100/85">From estimation to invoice without losing context.</span>
                </span>
              </li>
            </ul>
          </aside>
        ) : null}

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
          <div
            className={`glass-auth-card w-full animate-fade-in rounded-2xl p-8 shadow-2xl sm:p-10 ${cardClassName}`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
