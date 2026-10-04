// What the assistant may do for each role. Mirrors ROLE_TOOLS in ml-service/app/tools.py,
// which is the enforced list. The backend still checks every underlying request.
import type { Role } from '@/api/types'

export const ALLOWED_SCOPE: Record<Role, string[]> = {
  DISPATCHER: ['Order status', "Today's trips", 'Deferred orders', 'Notifications'],
  LOADER: ['Order status', "Today's trips", 'Notifications'],
  DRIVER: ['Order status', "Today's trip", 'Notifications'],
  STORE_MANAGER: ['Your order status', 'Notifications'],
  ADMIN: ['System health', 'Audit log', 'User accounts', 'Fleet', 'Notifications'],
}

export const RESTRICTED_SCOPE: Record<Role, string[]> = {
  DISPATCHER: ['Changing plans', 'Other depots'],
  LOADER: ['Deferred orders', 'Changing loads'],
  DRIVER: ['Other trips', 'Changing deliveries'],
  STORE_MANAGER: ['Other outlets', 'Deferred orders'],
  ADMIN: ['Orders, trips and planning', 'Changing operational data'],
}

export const SUGGESTED_PROMPTS: Record<Role, string[]> = {
  DISPATCHER: ['Are there any deferred orders right now?', 'What trips are running today?', 'Show my notifications'],
  LOADER: ["What trips are on today's loading list?", 'Show my notifications'],
  DRIVER: ["What is on today's trip?", 'Show my notifications'],
  STORE_MANAGER: ['Where is my latest order?', 'Show my notifications'],
  ADMIN: ['Is the system healthy right now?', 'Show the most recent audit log entries', 'List the fleet'],
}
