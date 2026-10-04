// Response shapes returned by the Waypoint backend and AI service.
// Field names match the Java records in hackathon/backend. Times arrive as "HH:mm:ss".

export type Role = 'DISPATCHER' | 'LOADER' | 'DRIVER' | 'STORE_MANAGER' | 'ADMIN'

export interface LoginResponse {
  token: string
  userId: string
  username: string
  fullName: string
  role: Role
  permissions: string[]
  outletId: string | null
  depotId: string | null
}

export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'DEFERRED'
  | 'PLANNED'
  | 'ALLOCATED'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RECEIVED'
  | 'CLOSED'

export interface OrderItem {
  itemName: string
  quantity: number
}

export interface Order {
  id: string
  orderCode: string
  outletCode: string
  brand: 'FRESH' | 'STYLE' | 'TECH'
  status: OrderStatus
  tempRequirement: 'AMBIENT' | 'CHILLED'
  orderUnits: number
  orderWeightKg: number
  orderVolumeM3: number
  deferralReason: string | null
  items: OrderItem[]
}

export interface DomainEvent {
  id: string
  entityType: string
  entityId: string
  eventType: string
  previousState: string | null
  newState: string | null
  userId: string | null
  metadata: string | null
  createdAt: string
}

export type TripStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'LOADING'
  | 'READY'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface TripStop {
  stopId: string
  orderId: string
  sequence: number
  orderCode: string
  outletCode: string
  orderStatus: OrderStatus
  plannedArrivalTime: string
  distanceFromPreviousKm: number
}

export interface Trip {
  id: string
  depotCode: string
  vehicleCode: string
  tripDate: string
  tripNumber: number
  status: TripStatus
  brand: 'FRESH' | 'STYLE' | 'TECH'
  district: string
  totalWeightKg: number
  totalVolumeM3: number
  totalDistanceKm: number
  fuelLitres: number
  plannedDurationMin: number
  stops: TripStop[]
}

export interface DeferredOrder {
  orderCode: string
  outletCode: string
  reasons: string[]
}

export interface Plan {
  id: string
  planDate: string
  status: 'DRAFT' | 'APPROVED' | 'SUPERSEDED'
  trips: Trip[]
  deferred: DeferredOrder[]
}

export interface VehicleResponse {
  id: string
  vehicleCode: string
  type: 'TRUCK' | 'VAN'
  temp: 'REEFER' | 'AMBIENT'
  weightCapKg: number
  volumeCapM3: number
  fuelType: string
  kmPerL: number
  weeklyFuelQuotaL: number
  depotCode: string
}

export interface VehicleAvailability {
  id: string
  vehicleCode: string
  type: 'TRUCK' | 'VAN'
  temp: 'REEFER' | 'AMBIENT'
  tripsToday: number
  maxTripsPerDay: number
}

export interface OutletResponse {
  id: string
  outletCode: string
  brand: 'FRESH' | 'STYLE' | 'TECH'
  district: string
  depotCode: string
  dockType: string
  parkingConstraint: string
  mallWindowStart: string | null
  mallWindowEnd: string | null
  windowOpenTime: string
  windowCloseTime: string
}

export interface Kpis {
  ordersToday: number
  ordersServed: number
  ordersDeferred: number
  vehiclesActive: number
  tripsActive: number
  lateRiskStops: number
  fuelPlannedLitres: number
  fuelUtilizationPct: number
}

export interface Alert {
  type: string
  severity: 'RED' | 'AMBER'
  message: string
  at: string | null
}

export interface DriverStop {
  stopId: string
  sequence: number
  orderCode: string
  outletCode: string
  orderUnits: number
  plannedArrivalTime: string
  windowClose: string
  deliveryStatus: 'PENDING' | 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED' | 'PARTIAL' | 'FAILED' | 'RECEIPT_CONFIRMED'
  windowRisk: 'NONE' | 'LATE'
  deliveredUnits: number | null
  exceptionReason: string | null
  routeNote: string | null
}

export interface DriverSummary {
  tripId: string
  tripStatus: TripStatus
  totalStops: number
  completedStops: number
  pendingStops: number
  remainingDistanceKm: number
  nextOrderCode: string | null
  nextOutletCode: string | null
  nextArrival: string | null
  nextWindowClose: string | null
}

export interface StoreOrder {
  id: string
  orderCode: string
  status: OrderStatus
  orderUnits: number
  deliveryStatus: string | null
  deliveredUnits: number | null
  receivedUnits: number | null
  discrepancy: boolean
  deferralReason: string | null
  expectedArrival: string | null
}

export interface StoreSummary {
  ordersToday: number
  inTransit: number
  delivered: number
  lateRiskOrders: number
  recentOrders: StoreOrder[]
  inTransitEtas: { orderCode: string; eta: string }[]
}

export interface Notification {
  id: string
  eventType: string
  entityType: string | null
  entityId: string | null
  message: string
  read: boolean
  createdAt: string
}

export interface LoadingEvent {
  type: 'STARTED' | 'COMPLETED' | 'SHORTFALL' | 'DAMAGE' | 'OTHER'
  orderId: string | null
  description: string | null
  at: string
}

export interface SyncResult {
  eventId: string
  status: 'SYNCED' | 'CONFLICT'
  message: string
}

export interface SyncStatus {
  synced: number
  conflicts: number
  recent: SyncResult[]
}

export interface AdminUser {
  id: string
  username: string
  fullName: string
  role: Role
  depotId: string | null
  outletId: string | null
  active: boolean
}

export interface Depot {
  id: string
  code: string
  name: string
  district: string
}

export interface AuditLog {
  id: string
  userId: string | null
  role: string | null
  action: string
  entityType: string | null
  entityId: string | null
  source: string | null
  result: string | null
  metadata: string | null
  createdAt: string
}

export interface ApiErrorBody {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}
