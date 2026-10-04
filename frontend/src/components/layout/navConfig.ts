import {
  Activity,
  AlertTriangle,
  ClipboardList,
  FlagTriangleRight,
  History,
  LayoutDashboard,
  LocateFixed,
  Map,
  Navigation,
  PackageCheck,
  PackageSearch,
  RefreshCcw,
  Route as RouteIcon,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/api/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  DISPATCHER: [
    { label: 'Dashboard', to: '/dispatcher/dashboard', icon: LayoutDashboard },
    { label: 'Orders', to: '/dispatcher/orders', icon: PackageSearch },
    { label: 'Planning', to: '/dispatcher/planning', icon: RouteIcon },
    { label: 'Vehicles', to: '/dispatcher/vehicles', icon: Truck },
    { label: 'Trips', to: '/dispatcher/trips', icon: Map },
    { label: 'Monitoring', to: '/dispatcher/monitoring', icon: LocateFixed },
    { label: 'Deferred Orders', to: '/dispatcher/deferred', icon: AlertTriangle },
  ],
  LOADER: [
    { label: 'Dashboard', to: '/loader/dashboard', icon: LayoutDashboard },
    { label: "Today's Loads", to: '/loader/tasks', icon: ClipboardList },
    { label: 'Issues', to: '/loader/issues', icon: FlagTriangleRight },
  ],
  DRIVER: [
    { label: 'Today', to: '/driver/dashboard', icon: LayoutDashboard },
    { label: 'My Trip', to: '/driver/trip', icon: RouteIcon },
    { label: 'Stops', to: '/driver/stops', icon: Navigation },
    { label: 'Record Delivery', to: '/driver/delivery', icon: PackageCheck },
    { label: 'Sync', to: '/driver/sync', icon: RefreshCcw },
  ],
  STORE_MANAGER: [
    { label: 'Dashboard', to: '/store/dashboard', icon: LayoutDashboard },
    { label: 'My Orders', to: '/store/orders', icon: ShoppingBag },
    { label: 'Track & Receive', to: '/store/tracking', icon: LocateFixed },
  ],
  ADMIN: [
    { label: 'Overview', to: '/admin/overview', icon: Activity },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Fleet', to: '/admin/fleet', icon: Truck },
    { label: 'Audit Log', to: '/admin/audit', icon: History },
    { label: 'Access', to: '/admin/access', icon: ShieldCheck },
  ],
}

export const HOME_BY_ROLE: Record<Role, string> = {
  DISPATCHER: '/dispatcher/dashboard',
  LOADER: '/loader/dashboard',
  DRIVER: '/driver/dashboard',
  STORE_MANAGER: '/store/dashboard',
  ADMIN: '/admin/overview',
}
