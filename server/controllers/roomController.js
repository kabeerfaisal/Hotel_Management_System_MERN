import Room from '../models/Room.js'

const ROOM_FIELDS = [
  'roomNumber',
  'type',
  'pricePerNight',
  'capacity',
  'status',
  'amenities',
  'description',
]

/**
 * Keep only known, client-editable fields so callers cannot inject
 * timestamps or other schema internals.
 */
function pickRoomFields(body = {}) {
  return ROOM_FIELDS.reduce((fields, field) => {
    if (body[field] !== undefined) fields[field] = body[field]
    return fields
  }, {})
}

/**
 * Normalize amenities from either an array or a comma-separated string.
 */
function normalizeAmenities(amenities) {
  if (amenities === undefined) return undefined

  const values = Array.isArray(amenities) ? amenities : String(amenities).split(',')

  return values
    .map((amenity) => String(amenity).trim())
    .filter((amenity) => amenity.length > 0)
}

function sendRoomError(res, error, fallbackMessage) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: Object.values(error.errors).map((fieldError) => ({
        field: fieldError.path,
        message: fieldError.message,
      })),
    })
  }

  if (error.name === 'CastError') {
    // A malformed ObjectId can never match an existing room.
    if (error.path === '_id') {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    return res.status(400).json({
      success: false,
      message: `Invalid value for ${error.path}`,
    })
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A room with this number already exists',
    })
  }

  console.error('[rooms]', error)
  return res.status(500).json({ success: false, message: fallbackMessage })
}

export async function getRooms(req, res) {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 })

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    })
  } catch (error) {
    return sendRoomError(res, error, 'Unable to load rooms')
  }
}

export async function getRoomById(req, res) {
  try {
    const room = await Room.findById(req.params.id)

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    return res.status(200).json({ success: true, room })
  } catch (error) {
    return sendRoomError(res, error, 'Unable to load room')
  }
}

export async function createRoom(req, res) {
  try {
    const fields = pickRoomFields(req.body)
    const amenities = normalizeAmenities(fields.amenities)

    const room = await Room.create({
      ...fields,
      ...(amenities === undefined ? {} : { amenities }),
    })

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room,
    })
  } catch (error) {
    return sendRoomError(res, error, 'Unable to create room')
  }
}

export async function updateRoom(req, res) {
  try {
    const fields = pickRoomFields(req.body)

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields were provided',
      })
    }

    const amenities = normalizeAmenities(fields.amenities)

    if (amenities !== undefined) fields.amenities = amenities

    const room = await Room.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    })

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      room,
    })
  } catch (error) {
    return sendRoomError(res, error, 'Unable to update room')
  }
}

export async function deleteRoom(req, res) {
  try {
    const room = await Room.findByIdAndDelete(req.params.id)

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      room,
    })
  } catch (error) {
    return sendRoomError(res, error, 'Unable to delete room')
  }
}
