import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

import User from '../models/User.js'

const SALT_ROUNDS = 12
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72 // bcrypt only uses the first 72 bytes
const RESET_CODE_ROUNDS = 10
const RESET_CODE_TTL_MS = 15 * 60 * 1000

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

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

// Public sign-up always creates a guest; staff roles are assigned by an admin.
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

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User no longer exists',
      })
    }

    return res.status(200).json({
      success: true,
      user: toPublicUser(user),
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      })
    }

    console.error('[auth] getMe failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to load profile',
    })
  }
}

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

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
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

// Local demo: the plaintext reset code is returned as `devResetCode` instead of
// being emailed. Replace with a real mail provider before production.
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body ?? {}

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const genericMessage =
      'If an account exists for this email, a reset code has been generated.'

    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      // Do not reveal whether the email is registered.
      return res.status(200).json({ success: true, message: genericMessage })
    }

    const resetCode = crypto.randomInt(100000, 1000000).toString()
    const hashedCode = await bcrypt.hash(resetCode, RESET_CODE_ROUNDS)

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetCode: hashedCode,
          resetCodeExpiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
        },
      },
    )

    return res.status(200).json({
      success: true,
      message: 'Reset code generated. It expires in 15 minutes.',
      expiresInMinutes: RESET_CODE_TTL_MS / 60_000,
      // Local demo only — remove when wiring a real email provider.
      devResetCode: resetCode,
    })
  } catch (error) {
    return sendAuthError(res, error, 'Unable to generate a reset code')
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body ?? {}

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code and new password are required',
      })
    }

    const plainPassword = String(newPassword)

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

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetCode +resetCodeExpiresAt',
    )

    if (!user?.resetCode || !user?.resetCodeExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
      })
    }

    if (user.resetCodeExpiresAt.getTime() < Date.now()) {
      await User.updateOne(
        { _id: user._id },
        { $unset: { resetCode: 1, resetCodeExpiresAt: 1 } },
      )

      return res.status(400).json({
        success: false,
        message: 'This reset code has expired. Request a new one.',
      })
    }

    const isCodeValid = await bcrypt.compare(String(code).trim(), user.resetCode)

    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
      })
    }

    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS)

    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetCode: 1, resetCodeExpiresAt: 1 },
      },
    )

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now sign in.',
    })
  } catch (error) {
    return sendAuthError(res, error, 'Unable to reset the password')
  }
}
