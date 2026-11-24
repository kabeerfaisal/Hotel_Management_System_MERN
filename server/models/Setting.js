import mongoose from 'mongoose'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const settingSchema = new mongoose.Schema(
  {
    hotelName: {
      type: String,
      default: 'LuxuryStay Hospitality',
      trim: true,
      maxlength: [100, 'Hotel name cannot exceed 100 characters'],
    },
    taxRate: {
      type: Number,
      default: 10,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100'],
    },
    checkInTime: {
      type: String,
      default: '14:00',
      match: [TIME_PATTERN, 'Check-in time must use HH:mm (24-hour) format'],
    },
    checkOutTime: {
      type: String,
      default: '12:00',
      match: [TIME_PATTERN, 'Check-out time must use HH:mm (24-hour) format'],
    },
    cancellationPolicy: {
      type: String,
      default: 'Free cancellation up to 24 hours before check-in.',
      trim: true,
      maxlength: [1000, 'Cancellation policy cannot exceed 1000 characters'],
    },
  },
  { timestamps: true },
)

const Setting = mongoose.model('Setting', settingSchema)

export default Setting
