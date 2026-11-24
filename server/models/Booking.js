import mongoose from 'mongoose'

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'checked-in',
  'checked-out',
  'cancelled',
]

const STAY_CHANGE_STATUSES = ['none', 'pending', 'approved', 'rejected']

const stayChangeRequestSchema = new mongoose.Schema(
  {
    requestedCheckInDate: {
      type: Date,
    },
    requestedCheckOutDate: {
      type: Date,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Stay change note cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: STAY_CHANGE_STATUSES,
        message: 'Invalid stay change status: {VALUE}',
      },
      default: 'none',
    },
    requestedAt: {
      type: Date,
    },
  },
  { _id: false },
)

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
    numberOfGuests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Number of guests must be at least 1'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      maxlength: [20, 'Contact phone cannot exceed 20 characters'],
    },
    specialRequests: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Special requests cannot exceed 500 characters'],
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
    stayChangeRequest: {
      type: stayChangeRequestSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
)

// Speeds up the overlap query used before every booking is created.
bookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
