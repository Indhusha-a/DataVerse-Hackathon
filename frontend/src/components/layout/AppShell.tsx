import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AIAssistant } from '@/components/ai/AIAssistant'

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-svh bg-navy-950">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 lg:rounded-tl-2xl lg:border-t lg:border-l lg:border-slate-200/80">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 lg:px-8 lg:pt-8 lg:pb-28">
          <Outlet />
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
