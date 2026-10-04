import { Badge } from '@/components/common/Badge'
import type { OrderStatus, TripStatus } from '@/api/types'
import { DELIVERY_STATUS, ORDER_STATUS, TRIP_STATUS } from '@/lib/labels'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = ORDER_STATUS[status]
  return <Badge tone={tone} dot>{label}</Badge>
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const { label, tone } = TRIP_STATUS[status]
  return <Badge tone={tone} dot>{label}</Badge>
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  const entry = DELIVERY_STATUS[status] ?? { label: status, tone: 'neutral' as const }
  return <Badge tone={entry.tone} dot>{entry.label}</Badge>
}

export function LateBadge() {
  return <Badge tone="danger">Arrived after window</Badge>
}

export function ReefBadge() {
  return <Badge tone="info">Chilled</Badge>
}
