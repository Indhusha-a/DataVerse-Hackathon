// Hotlinked Unsplash photos, each fetched and reviewed for content before use.
export const LOGISTICS_IMAGES = [
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7', // truck, open highway
  'https://images.unsplash.com/photo-1578575437130-527eed3abbec', // container ship, port cranes
  'https://images.unsplash.com/photo-1494412651409-8963ce7935a7', // aerial container yard
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d', // warehouse interior, boxes on shelving
  'https://images.unsplash.com/photo-1601599561213-832382fd07ba', // chilled grocery aisle
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866', // warehouse pallet racking
]

export function unsplashUrl(base: string, width: number, quality = 65) {
  return `${base}?fm=jpg&q=${quality}&w=${width}&auto=format&fit=crop&ixlib=rb-4.1.0`
}
