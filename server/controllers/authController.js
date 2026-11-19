import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import User from '../models/User.js'

const SALT_ROUNDS = 12
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72 // bcrypt only uses the first 72 bytes

/**
 * Sign a short-lived access token containing the user's id and role.
 */
function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

/**
 * Shape a user document for API responses — never expose the password hash.
 */
function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  }
}

function sendAuthError(res, error, fallbackMessage) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
    })
  }

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

  console.error('[auth]', error)
  return res.status(500).json({ success: false, message: fallbackMessage })
}

/**
 * POST /api/auth/register
 * Public registration always creates a guest account.
 * Staff roles are assigned later by an administrator.
 */
export async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body ?? {}

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      })
    }

    const plainPassword = String(password)

    if (plainPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      })
    }

    if (plainPassword.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`,
      })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const existingUser = await User.exists({ email: normalizedEmail })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      })
    }

    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS)

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: 'guest',
    })

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: signToken(user),
      user: toPublicUser(user),
    })
  } catch (error) {
    return sendAuthError(res, error, 'Unable to create account')
  }
}

/**
 * POST /api/auth/login
 * Returns the same generic error for unknown emails and bad passwords.
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {}

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token: signToken(user),
      user: toPublicUser(user),
    })
  } catch (error) {
    return sendAuthError(res, error, 'Unable to log in')
  }
}
