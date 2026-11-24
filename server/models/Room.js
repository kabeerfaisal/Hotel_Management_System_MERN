import mongoose from 'mongoose'

export const ROOM_STATUSES = ['available', 'occupied', 'cleaning', 'maintenance']

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Room number cannot exceed 10 characters'],
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      trim: true,
      maxlength: [40, 'Room type cannot exceed 40 characters'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price per night cannot be negative'],
    },
    capacity: {
      type: Number,
      default: 2,
      min: [1, 'Capacity must be at least 1 guest'],
    },
    status: {
      type: String,
      enum: {
        values: ROOM_STATUSES,
        message: 'Invalid room status: {VALUE}',
      },
      default: 'available',
    },
    amenities: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  { timestamps: true },
)

const Room = mongoose.model('Room', roomSchema)

export default Room
