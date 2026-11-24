/**
 * Role-aware console labels used by the staff header and sidebar.
 */
export function getPortalLabel(role) {
  if (role === 'admin') return 'Admin Console'
  if (role === 'guest') return 'Guest Concierge'
  return 'Staff Portal'
}
