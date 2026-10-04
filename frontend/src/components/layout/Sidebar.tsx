import { NavLink } from 'react-router-dom'
import { ChevronLeft, LogOut, Waypoints, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { ROLE_LABEL } from '@/lib/labels'
import { NAV_ITEMS } from './navConfig'

function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const signOut = useAuthStore((s) => s.signOut)
  if (!currentUser) return null
  const items = NAV_ITEMS[currentUser.role]
  const initials = currentUser.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-2.5 px-5 py-5', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600">
          <Waypoints className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && <span className="font-display text-[17px] font-bold tracking-tight text-white">WAYPOINT</span>}
      </div>

      <nav className={cn('flex-1 space-y-1 px-3 py-2', collapsed && 'px-2')}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 h-5 w-0.5 rounded-full bg-brand-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={cn('border-t border-white/10 px-3 py-3', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3 rounded-lg px-2 py-2', collapsed && 'justify-center px-0')}>
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: currentUser.avatarColor }}
            title={collapsed ? currentUser.fullName : undefined}
          >
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{currentUser.fullName}</p>
                <p className="truncate text-xs text-slate-400">{ROLE_LABEL[currentUser.role]}</p>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  return (
    <>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 76 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative hidden flex-shrink-0 bg-navy-950 lg:block"
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        <button
          onClick={toggleSidebar}
          aria-label="Collapse navigation"
          className="absolute top-6 -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-navy-800 text-slate-300 shadow-md hover:bg-navy-600 hover:text-white"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 z-50 h-full w-72 bg-navy-950 lg:hidden"
            >
              <button
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="absolute top-5 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
