/** Newest first. Order codes are zero-padded and date-prefixed (ORD-20261004-0022),
 * so a plain string sort puts the latest order first without needing a date field. */
export function byOrderCodeDesc<T extends { orderCode: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.orderCode.localeCompare(a.orderCode))
}
