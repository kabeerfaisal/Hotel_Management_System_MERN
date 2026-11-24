import mongoose from 'mongoose'

export const SERVICE_CATEGORIES = [
  'housekeeping',
  'maintenance',
  'room-service',
  'laundry',
  'transportation',
  'wake-up-call',
]

export const SERVICE_PRIORITIES = ['low', 'medium', 'high']
export const SERVICE_STATUSES = ['pending', 'in-progress', 'completed']

const serviceRequestSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: { values: SERVICE_CATEGORIES, message: 'Invalid category: {VALUE}' },
      required: [true, 'Category is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requested-by user is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    priority: {
      type: String,
      enum: { values: SERVICE_PRIORITIES, message: 'Invalid priority: {VALUE}' },
      default: 'medium',
    },
    status: {
      type: String,
      enum: { values: SERVICE_STATUSES, message: 'Invalid status: {VALUE}' },
      default: 'pending',
    },
    charge: {
      type: Number,
      default: 0,
      min: [0, 'Charge cannot be negative'],
    },
  },
  { timestamps: true },
)

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema)

export default ServiceRequest
