const ROOM_IMAGES = {
  presidential:
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  suite:
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
  deluxe:
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  standard:
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  default:
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
}

/**
 * Map a room type (Deluxe, Suite, Presidential, Standard…) to a curated
 * Unsplash interior. Falls back to a generic luxury room.
 */
export function getRoomImage(type = '') {
  const normalized = String(type).toLowerCase()

  if (normalized.includes('presidential')) return ROOM_IMAGES.presidential
  if (normalized.includes('suite')) return ROOM_IMAGES.suite
  if (normalized.includes('deluxe')) return ROOM_IMAGES.deluxe
  if (normalized.includes('standard')) return ROOM_IMAGES.standard

  return ROOM_IMAGES.default
}
