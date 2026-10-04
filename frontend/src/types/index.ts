// Core domain types for the WAYPOINT Designathon prototype.
// Mirrors outlets.csv / vehicles.csv / calendar.csv and the four-role workflow
// described in Problem.md and Build_Plan.md.

export type Role = 'DISPATCHER' | 'LOADER' | 'DRIVER' | 'STORE_MANAGER'

export type Brand = 'Fresh' | 'Style' | 'Tech'

export type Depot = 'Peliyagoda' | 'Kandy'

export interface User {
  id: string
  name: string
  role: Role
  depot?: Depot
  outletId?: string // for STORE_MANAGER
  avatarColor: string
}

export type TempRequirement = 'chilled' | 'ambient'

export type OrderStatus =
  | 'CONFIRMED'
  | 'PLANNED'
  | 'DEFERRED'
  | 'LOADING'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RECEIVED'

export type Priority = 'critical' | 'standard'

export interface OrderEvent {
  id: string
  type: string
  label: string
  timestamp: string
}

export interface Order {
  id: string
  outletId: string
  outletName: string
  brand: Brand
  district: string
  depot: Depot
  tempRequirement: TempRequirement
  units: number
  weightKg: number
  volumeM3: number
  windowOpen: string
  windowClose: string
  priority: Priority
  status: OrderStatus
  vehicleId?: string
  tripId?: string
  deferredReason?: string
  daysSinceLastServed?: number
  etaLabel?: string
  latenessRisk?: number // 0-1, from the Datathon service — shown as an operational signal
  events: OrderEvent[]
}

export type VehicleType = 'truck' | 'van'
export type VehicleTemp = 'reefer' | 'ambient'
export type VehicleStatus = 'available' | 'active' | 'in_workshop'

export interface Vehicle {
  id: string
  type: VehicleType
  temp: VehicleTemp
  weightCapKg: number
  volumeCapM3: number
  weightUsedKg: number
  volumeUsedM3: number
  weeklyFuelQuotaL: number
  fuelUsedL: number
  depot: Depot
  status: VehicleStatus
  tripsToday: 0 | 1 | 2
}

export type TripStatus = 'planned' | 'loading' | 'dispatched' | 'in_progress' | 'completed'

export interface TripStop {
  orderId: string
  outletId: string
  outletName: string
  sequence: number
  eta: string
  priority: Priority
  status: 'pending' | 'current' | 'done'
}

export interface Trip {
  id: string
  vehicleId: string
  driverId: string
  brand: Brand
  district: string
  tripNumber: 1 | 2
  status: TripStatus
  stops: TripStop[]
}

export type LoadingTaskStatus = 'pending' | 'in_progress' | 'loaded' | 'shortfall'

export interface LoadingTask {
  id: string
  tripId: string
  vehicleId: string
  status: LoadingTaskStatus
  orderIds: string[]
  weightKg: number
  volumeM3: number
  loadedCount: number
  issue?: string
}

export interface Outlet {
  id: string
  name: string
  brand: Brand
  district: string
  depot: Depot
  dockType: 'rear_dock' | 'street' | 'mall_bay'
  parkingConstraint: 'normal' | 'van_only' | 'mall_dock'
  windowOpen: string
  windowClose: string
}

export interface Notification {
  id: string
  role: Role
  title: string
  body: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  timestamp: string
  read: boolean
}
