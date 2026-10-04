// Presentation for dispatcher alerts. Types come from the backend dashboard service.

const TITLES: Record<string, string> = {
  DELIVERY_WINDOW_LATE: 'Late arrival',
  DELIVERY_EXCEPTION: 'Delivery exception',
  RECEIPT_DISCREPANCY: 'Receipt discrepancy',
  LOADING_SHORTFALL: 'Loading shortfall',
  LOADING_ISSUE: 'Loading issue',
  ORDERS_DEFERRED: 'Orders deferred',
  VEHICLE_CAPACITY_CONFLICT: 'Capacity conflict',
}

export function alertTone(severity: 'RED' | 'AMBER') {
  return {
    className: severity === 'RED' ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600',
    label: (type: string) => TITLES[type] ?? type,
  }
}
