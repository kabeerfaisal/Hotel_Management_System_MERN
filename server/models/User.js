import mongoose from 'mongoose'

export const USER_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'guest']

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      // Never returned by queries unless explicitly selected.
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: 'Invalid role: {VALUE}',
      },
      default: 'guest',
    },
  },
  { timestamps: true },
)

const User = mongoose.model('User', userSchema)

export default User
