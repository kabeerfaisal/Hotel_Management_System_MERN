import mongoose from 'mongoose'

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'checked-in',
  'checked-out',
  'cancelled',
]

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A guest is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'A room is required'],
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
      validate: {
        validator(value) {
          return !this.checkInDate || value > this.checkInDate
        },
        message: 'Check-out date must be after the check-in date',
      },
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message: 'Invalid booking status: {VALUE}',
      },
      default: 'pending',
    },
  },
  { timestamps: true },
)

// Speeds up the overlap query used before every booking is created.
bookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
