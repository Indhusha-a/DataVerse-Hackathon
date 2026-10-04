// Human labels for backend status values. Keep these aligned with the backend enums.
import type { Role, OrderStatus, TripStatus } from '@/api/types'
import type { BadgeTone } from '@/components/common/Badge'

export const ROLE_LABEL: Record<Role, string> = {
  DISPATCHER: 'Dispatcher',
  LOADER: 'Loader',
  DRIVER: 'Driver',
  STORE_MANAGER: 'Store Manager',
  ADMIN: 'Administrator',
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  CREATED: { label: 'Created', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmed', tone: 'neutral' },
  DEFERRED: { label: 'Deferred', tone: 'danger' },
  PLANNED: { label: 'Planned', tone: 'brand' },
  ALLOCATED: { label: 'Allocated', tone: 'brand' },
  LOADED: { label: 'Loaded', tone: 'info' },
  IN_TRANSIT: { label: 'In transit', tone: 'brand' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  RECEIVED: { label: 'Received', tone: 'success' },
  CLOSED: { label: 'Closed', tone: 'success' },
}

export const TRIP_STATUS: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PLANNED: { label: 'Planned', tone: 'neutral' },
  LOADING: { label: 'Loading', tone: 'warning' },
  READY: { label: 'Ready', tone: 'info' },
  DISPATCHED: { label: 'Dispatched', tone: 'brand' },
  IN_PROGRESS: { label: 'In progress', tone: 'brand' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
}

export const DELIVERY_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  EN_ROUTE: { label: 'En route', tone: 'brand' },
  ARRIVED: { label: 'Arrived', tone: 'info' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  PARTIAL: { label: 'Partial', tone: 'warning' },
  FAILED: { label: 'Failed', tone: 'danger' },
  RECEIPT_CONFIRMED: { label: 'Receipt confirmed', tone: 'success' },
}

export const ACTION_LABEL: Record<string, string> = {
  LOGIN_SUCCESS: 'Signed in',
  LOGIN_FAILURE: 'Failed sign-in',
  LOGOUT: 'Signed out',
  ORDER_CREATED: 'Order created',
  ORDER_UPDATED: 'Order edited',
  ORDER_CONFIRMED: 'Order confirmed',
  ORDER_DEFERRED: 'Order deferred',
  PLAN_GENERATED: 'Plan generated',
  PLAN_APPROVED: 'Plan approved',
  PLAN_SUPERSEDED: 'Plan replanned',
  TRIP_DISPATCHED: 'Trip dispatched',
  TRIP_STARTED: 'Trip started',
  TRIP_COMPLETED: 'Trip completed',
  LOADING_STARTED: 'Loading started',
  LOADING_COMPLETED: 'Loading completed',
  LOADING_ISSUE_REPORTED: 'Loading issue reported',
  DRIVER_ARRIVED: 'Driver arrived',
  DELIVERY_RECORDED: 'Delivery recorded',
  RECEIPT_CONFIRMED: 'Receipt confirmed',
  SYNC_BATCH_PROCESSED: 'Offline events synced',
  AI_TOOL_CALL: 'Assistant tool call',
  USER_CREATED: 'User created',
  USER_UPDATED: 'User updated',
  VEHICLE_CREATED: 'Vehicle created',
  VEHICLE_UPDATED: 'Vehicle updated',
  VEHICLE_DELETED: 'Vehicle deleted',
  DEMO_DATA_RESET: 'Demo data reset',
  DEMO_DATA_SEEDED: 'Demo data seeded',
}
