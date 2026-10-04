import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Gauge, Radio, ShieldCheck, Truck, Waypoints, WifiOff } from 'lucide-react'
import { RouteArt } from '@/components/common/RouteArt'
import { LOGISTICS_IMAGES, unsplashUrl } from '@/lib/images'

const FEATURES = [
  {
    icon: Gauge,
    title: 'Intelligent planning',
    body: 'Every allocation checks capacity, temperature, outlet access, delivery windows, fuel quotas and the two-trip daily limit. Deferred orders come with the reasons.',
  },
  {
    icon: Radio,
    title: 'Operational visibility',
    body: 'Trip progress, late arrivals, shortfalls and deferrals in one place. Dispatchers see problems as they happen, not afterwards.',
  },
  {
    icon: WifiOff,
    title: 'Offline-first driver',
    body: 'Drivers keep recording stops when coverage drops. Every action carries an event id and synchronizes on reconnect without duplicating work.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-scoped assistant',
    body: 'One assistant, four roles. It reads only what the signed-in user may see, and every tool call is audited.',
  },
]

const STATS = [
  { value: '120', label: 'Outlets' },
  { value: '3', label: 'Brands — Fresh, Style, Tech' },
  { value: '2', label: 'Depots — Peliyagoda, Kandy' },
  { value: '60', label: 'Vehicles in the fleet' },
]

/** A photo with a graceful fallback: if the hotlinked image fails to load
 * (blocked network, offline), the generated route art underneath stays
 * visible instead of leaving a blank panel. */
function BackgroundPhoto({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={className}>
      <RouteArt className="absolute inset-0 h-full w-full" />
      {!failed && (
        <img src={src} alt="" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-svh bg-navy-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Waypoints className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">WAYPOINT</span>
        </div>
        <Link
          to="/login"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
        >
          Sign in
        </Link>
      </header>

      <section className="relative overflow-hidden">
        <BackgroundPhoto src={unsplashUrl(LOGISTICS_IMAGES[0], 2000)} className="absolute inset-0 opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/90 to-navy-950" />

        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 text-center sm:pt-24">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm"
          >
            <Truck className="h-3.5 w-3.5 text-brand-400" /> Waypoint Group · Peliyagoda &amp; Kandy
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            Intelligent Logistics
            <br />
            <span className="text-brand-400">Operations</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 font-display text-sm font-bold tracking-[0.3em] text-slate-400 uppercase"
          >
            Plan · Load · Deliver · Receive
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-6 max-w-xl text-base text-slate-300"
          >
            One platform for the Fresh, Style and Tech delivery day: from the store's order, through the planner's
            allocation and the loading dock, to the driver's stop and the store's receipt.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-colors hover:bg-brand-700"
            >
              Enter operations <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#platform"
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              See the platform
            </a>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-navy-900/60">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-white sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="border-t border-white/10 bg-navy-900">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/20">
                  <f.icon className="h-4.5 w-4.5 text-brand-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10">
        <BackgroundPhoto src={unsplashUrl(LOGISTICS_IMAGES[2], 1800)} className="absolute inset-0 opacity-20" />
        <div className="absolute inset-0 bg-navy-950/85" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to see it in motion?</h2>
          <p className="mt-3 text-sm text-slate-400">
            Sign in as any role to walk through a live operational day — ordering, planning, loading, delivery and receipt.
          </p>
          <Link
            to="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
          >
            Enter WAYPOINT <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-500">
        WAYPOINT · Tech-Triathlon 2026 · all operational data is synthetic
      </footer>
    </div>
  )
}
