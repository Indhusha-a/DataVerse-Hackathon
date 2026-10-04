import { apiRequest } from './client'
import type {
  AdminUser,
  Alert,
  AuditLog,
  Depot,
  DomainEvent,
  DriverStop,
  DriverSummary,
  Kpis,
  LoadingEvent,
  LoginResponse,
  Notification,
  Order,
  OutletResponse,
  Plan,
  Role,
  StoreOrder,
  StoreSummary,
  SyncResult,
  SyncStatus,
  Trip,
  VehicleAvailability,
  VehicleResponse,
} from './types'

// Auth
export const login = (username: string, password: string) =>
  apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: { username, password }, auth: false })
export const logout = () => apiRequest<void>('/api/auth/logout', { method: 'POST' })

// Reference
export const listOutlets = () => apiRequest<OutletResponse[]>('/api/outlets')
export const listVehicles = () => apiRequest<VehicleResponse[]>('/api/vehicles')
export const availableVehicles = (date: string) =>
  apiRequest<VehicleAvailability[]>('/api/vehicles/available', { query: { date } })

// Orders
export const listOrders = () => apiRequest<Order[]>('/api/orders')
export const getOrder = (id: string) => apiRequest<Order>(`/api/orders/${id}`)
export const createOrder = (body: {
  outletId: string
  tempRequirement: 'AMBIENT' | 'CHILLED'
  orderUnits: number
  orderWeightKg: number
  orderVolumeM3: number
  items: { itemName: string; quantity: number }[]
}) => apiRequest<Order>('/api/orders', { method: 'POST', body })
export const updateOrder = (id: string, body: Partial<{ tempRequirement: string; orderUnits: number; orderWeightKg: number; orderVolumeM3: number }>) =>
  apiRequest<Order>(`/api/orders/${id}`, { method: 'PATCH', body })
export const confirmOrder = (id: string) => apiRequest<Order>(`/api/orders/${id}/confirm`, { method: 'POST' })
export const deferOrder = (id: string, reason: string) =>
  apiRequest<Order>(`/api/orders/${id}/defer`, { method: 'POST', body: { reason } })
export const orderHistory = (orderId: string) =>
  apiRequest<DomainEvent[]>('/api/history', { query: { entityType: 'Order', entityId: orderId } })

// Planning
export const generatePlan = (date: string, orderIds?: string[]) =>
  apiRequest<Plan>('/api/planning/generate', { method: 'POST', query: { date }, body: orderIds ? { orderIds } : undefined })
export const currentPlan = (date: string) =>
  apiRequest<Plan>('/api/planning/current', { query: { date } })
export const approvePlan = (planId: string) => apiRequest<Plan>(`/api/planning/${planId}/approve`, { method: 'POST' })
export const replanPlan = (planId: string) => apiRequest<Plan>(`/api/planning/${planId}/replan`, { method: 'POST' })

// Trips
export const listTrips = (date: string) => apiRequest<Trip[]>('/api/trips', { query: { date } })
export const getTrip = (id: string) => apiRequest<Trip>(`/api/trips/${id}`)
export const dispatchTrip = (id: string) => apiRequest<Trip>(`/api/trips/${id}/dispatch`, { method: 'POST' })
export const completeTrip = (id: string) => apiRequest<Trip>(`/api/trips/${id}/complete`, { method: 'POST' })

// Loading
export const loaderTasks = (date: string) => apiRequest<Trip[]>('/api/loader/tasks', { query: { date } })
export const startLoading = (tripId: string) => apiRequest<Trip>(`/api/loading/${tripId}/start`, { method: 'POST' })
export const completeLoading = (tripId: string) => apiRequest<Trip>(`/api/loading/${tripId}/complete`, { method: 'POST' })
export const reportLoadingIssue = (
  tripId: string,
  body: { orderId?: string | null; type: 'SHORTFALL' | 'DAMAGE' | 'OTHER'; description: string },
) => apiRequest<void>(`/api/loading/${tripId}/issue`, { method: 'POST', body })
export const loadingEvents = (tripId: string) => apiRequest<LoadingEvent[]>(`/api/loading/${tripId}/events`)

// Driver
export const driverActiveTrips = (date: string) => apiRequest<Trip[]>('/api/driver/trips', { query: { date } })
export const driverSummary = (date: string, tripId?: string) =>
  apiRequest<DriverSummary>('/api/driver/summary', { query: { date, tripId } })
export const driverTrip = (date: string, tripId?: string) => apiRequest<Trip>('/api/driver/trip', { query: { date, tripId } })
export const driverStartTrip = (tripId: string) => apiRequest<Trip>(`/api/driver/trip/${tripId}/start`, { method: 'POST' })
export const driverStops = (date: string, tripId?: string) =>
  apiRequest<DriverStop[]>('/api/driver/stops', { query: { date, tripId } })
export const driverArrive = (stopId: string) =>
  apiRequest<DriverStop>(`/api/driver/stops/${stopId}/arrive`, { method: 'POST' })
export const driverRecordDelivery = (body: {
  stopId: string
  outcome: 'DELIVERED' | 'PARTIAL' | 'FAILED'
  deliveredUnits: number
  podReference?: string | null
  reason?: string | null
  notes?: string | null
}) => apiRequest<DriverStop>('/api/driver/deliveries', { method: 'POST', body })
export const syncEvents = (events: unknown[]) =>
  apiRequest<SyncResult[]>('/api/sync/events', { method: 'POST', body: { events } })
export const syncStatus = () => apiRequest<SyncStatus>('/api/sync/status')

// Store
export const storeOrders = () => apiRequest<StoreOrder[]>('/api/store/orders')
export const storeSummary = () => apiRequest<StoreSummary>('/api/store/orders/summary')
export const storeReceive = (orderId: string, body: { receivedUnits: number; notes?: string | null }) =>
  apiRequest<StoreOrder>(`/api/store/orders/${orderId}/receive`, { method: 'POST', body })

// Dashboard, notifications, history
export const dispatcherKpis = (date: string) =>
  apiRequest<Kpis>('/api/dashboard/kpis', { query: { date } })
export const dispatcherAlerts = () => apiRequest<Alert[]>('/api/dashboard/alerts')
export const notifications = () => apiRequest<Notification[]>('/api/notifications')
export const markNotificationRead = (id: string) =>
  apiRequest<void>(`/api/notifications/${id}/read`, { method: 'POST' })

// Admin
export const adminDepots = () => apiRequest<Depot[]>('/api/admin/depots')
export const adminUsers = () => apiRequest<AdminUser[]>('/api/admin/users')
export const adminCreateUser = (body: {
  username: string
  password: string
  fullName: string
  role: Role
  depotId: string | null
  outletId: string | null
}) => apiRequest<AdminUser>('/api/admin/users', { method: 'POST', body })
export const adminUpdateUser = (id: string, body: { role: Role; active: boolean }) =>
  apiRequest<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body })
export const adminCreateVehicle = (body: Record<string, unknown>) =>
  apiRequest<VehicleResponse>('/api/admin/vehicles', { method: 'POST', body })
export const adminUpdateVehicle = (id: string, body: Record<string, unknown>) =>
  apiRequest<VehicleResponse>(`/api/admin/vehicles/${id}`, { method: 'PUT', body })
export const adminDeleteVehicle = (id: string) => apiRequest<void>(`/api/admin/vehicles/${id}`, { method: 'DELETE' })
export const adminAuditLogs = (limit = 100) =>
  apiRequest<AuditLog[]>('/api/admin/audit-logs', { query: { limit } })
export const adminHealth = () => apiRequest<Record<string, string | number>>('/api/admin/health')
export const adminResetDemo = () => apiRequest<void>('/api/admin/demo/reset', { method: 'POST' })
export const adminSeedDemo = () => apiRequest<void>('/api/admin/demo/seed', { method: 'POST' })
