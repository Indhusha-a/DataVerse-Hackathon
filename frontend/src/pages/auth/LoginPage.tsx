import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList, LayoutDashboard, ShieldCheck, ShoppingBag, Truck, Waypoints } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/common/Button'
import { RouteArt } from '@/components/common/RouteArt'
import { LOGISTICS_IMAGES, unsplashUrl } from '@/lib/images'
import { errorMessage } from '@/api/client'
import type { Role } from '@/api/types'
import { HOME_BY_ROLE } from '@/components/layout/navConfig'

// Shown for reference only — the form below never auto-fills from these.
// A judge or teammate types the credentials themselves, same as any real account.
const DEMO_ACCOUNTS: { role: Role; username: string; label: string; icon: typeof LayoutDashboard }[] = [
  { role: 'DISPATCHER', username: 'dispatcher1', label: 'Dispatcher', icon: LayoutDashboard },
  { role: 'LOADER', username: 'loader1', label: 'Loader', icon: ClipboardList },
  { role: 'DRIVER', username: 'driver1', label: 'Driver', icon: Truck },
  { role: 'STORE_MANAGER', username: 'store1', label: 'Store Manager', icon: ShoppingBag },
  { role: 'ADMIN', username: 'admin1', label: 'Administrator', icon: ShieldCheck },
]

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const signIn = useAuthStore((s) => s.signIn)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bgIndex, setBgIndex] = useState(0)
  const [bgFailed, setBgFailed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setBgIndex((i) => (i + 1) % LOGISTICS_IMAGES.length), 5000)
    return () => clearInterval(id)
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await signIn(username.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : HOME_BY_ROLE[user.role], { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex">
        <RouteArt className="absolute inset-0 h-full w-full" />
        {!bgFailed && (
          <AnimatePresence>
            <motion.img
              key={bgIndex}
              src={unsplashUrl(LOGISTICS_IMAGES[bgIndex], 1400)}
              alt=""
              onError={() => setBgFailed(true)}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/75 to-navy-950" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Waypoints className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">WAYPOINT</span>
        </div>

        <div className="relative">
          <h2 className="font-display max-w-md text-3xl leading-tight font-bold">
            One platform connecting every role in the delivery workflow.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-slate-300">
            From order intake to receipt at the outlet: planning, loading, delivery and offline sync, on one record.
          </p>
        </div>

        <p className="relative text-xs text-slate-400">Tech-Triathlon 2026 · synthetic data only</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-6 lg:p-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Waypoints className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold text-slate-900">WAYPOINT</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use your Waypoint operations account.</p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-slate-600">
                Username
              </label>
              <input
                id="username"
                autoComplete="username"
                placeholder="e.g. dispatcher1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting || !username || !password}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-7">
            <p className="mb-2 text-xs font-medium text-slate-500">Seeded demo accounts</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((account) => (
                <div
                  key={account.username}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2.5',
                    username === account.username ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white',
                  )}
                >
                  <account.icon className={cn('h-4 w-4 flex-shrink-0', username === account.username ? 'text-brand-600' : 'text-slate-400')} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-800">{account.label}</span>
                    <span className="block truncate text-[11px] text-slate-400">{account.username}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
