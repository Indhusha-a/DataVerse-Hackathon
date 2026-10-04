import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AppShell } from '@/components/layout/AppShell'
import { RequireRole } from '@/routes/RequireRole'

import { DispatcherDashboard } from '@/pages/dispatcher/Dashboard'
import { DispatcherOrders } from '@/pages/dispatcher/Orders'
import { DispatcherPlanning } from '@/pages/dispatcher/Planning'
import { DispatcherVehicles } from '@/pages/dispatcher/Vehicles'
import { DispatcherTrips } from '@/pages/dispatcher/Trips'
import { DispatcherMonitoring } from '@/pages/dispatcher/Monitoring'
import { DispatcherDeferred } from '@/pages/dispatcher/Deferred'

import { LoaderDashboard } from '@/pages/loader/Dashboard'
import { LoaderTasks } from '@/pages/loader/Tasks'
import { LoaderIssues } from '@/pages/loader/Issues'

import { DriverDashboard } from '@/pages/driver/Dashboard'
import { DriverTrip } from '@/pages/driver/Trip'
import { DriverStops } from '@/pages/driver/Stops'
import { DriverDelivery } from '@/pages/driver/Delivery'
import { DriverSync } from '@/pages/driver/Sync'

import { StoreDashboard } from '@/pages/store/Dashboard'
import { StoreOrders } from '@/pages/store/Orders'
import { StoreTracking } from '@/pages/store/Tracking'

import { AdminOverview } from '@/pages/admin/Overview'
import { AdminUsers } from '@/pages/admin/Users'
import { AdminFleet } from '@/pages/admin/Fleet'
import { AdminAudit } from '@/pages/admin/Audit'
import { AdminAccess } from '@/pages/admin/Access'

function guarded(role: Parameters<typeof RequireRole>[0]['role'], element: React.ReactNode) {
  return <RequireRole role={role}>{element}</RequireRole>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppShell />}>
        <Route path="/dispatcher/dashboard" element={guarded('DISPATCHER', <DispatcherDashboard />)} />
        <Route path="/dispatcher/orders" element={guarded('DISPATCHER', <DispatcherOrders />)} />
        <Route path="/dispatcher/planning" element={guarded('DISPATCHER', <DispatcherPlanning />)} />
        <Route path="/dispatcher/vehicles" element={guarded('DISPATCHER', <DispatcherVehicles />)} />
        <Route path="/dispatcher/trips" element={guarded('DISPATCHER', <DispatcherTrips />)} />
        <Route path="/dispatcher/monitoring" element={guarded('DISPATCHER', <DispatcherMonitoring />)} />
        <Route path="/dispatcher/deferred" element={guarded('DISPATCHER', <DispatcherDeferred />)} />

        <Route path="/loader/dashboard" element={guarded('LOADER', <LoaderDashboard />)} />
        <Route path="/loader/tasks" element={guarded('LOADER', <LoaderTasks />)} />
        <Route path="/loader/issues" element={guarded('LOADER', <LoaderIssues />)} />

        <Route path="/driver/dashboard" element={guarded('DRIVER', <DriverDashboard />)} />
        <Route path="/driver/trip" element={guarded('DRIVER', <DriverTrip />)} />
        <Route path="/driver/stops" element={guarded('DRIVER', <DriverStops />)} />
        <Route path="/driver/delivery" element={guarded('DRIVER', <DriverDelivery />)} />
        <Route path="/driver/sync" element={guarded('DRIVER', <DriverSync />)} />

        <Route path="/store/dashboard" element={guarded('STORE_MANAGER', <StoreDashboard />)} />
        <Route path="/store/orders" element={guarded('STORE_MANAGER', <StoreOrders />)} />
        <Route path="/store/tracking" element={guarded('STORE_MANAGER', <StoreTracking />)} />

        <Route path="/admin/overview" element={guarded('ADMIN', <AdminOverview />)} />
        <Route path="/admin/users" element={guarded('ADMIN', <AdminUsers />)} />
        <Route path="/admin/fleet" element={guarded('ADMIN', <AdminFleet />)} />
        <Route path="/admin/audit" element={guarded('ADMIN', <AdminAudit />)} />
        <Route path="/admin/access" element={guarded('ADMIN', <AdminAccess />)} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
