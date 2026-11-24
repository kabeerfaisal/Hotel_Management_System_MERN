import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

import User from '../models/User.js'
import { sendEmail } from '../utils/sendEmail.js'

const SALT_ROUNDS = 12
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72 // bcrypt only uses the first 72 bytes
const RESET_CODE_ROUNDS = 10
const RESET_CODE_TTL_MS = 15 * 60 * 1000

function buildResetEmail(code) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;color:#2c2925;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6dfd2;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:#171a21;color:#f7f3e8;">
            <div style="font-size:20px;letter-spacing:2px;font-weight:bold;">LUXURYSTAY</div>
            <div style="margin-top:6px;font-size:11px;letter-spacing:3px;color:#d8b45a;">HOSPITALITY</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;color:#171a21;">Password reset code</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b463f;">
              Use the code below to choose a new password. It expires in 15 minutes.
            </p>
            <div style="margin:24px 0;padding:18px;text-align:center;background:#faf6ec;border:1px dashed #d8b45a;border-radius:12px;font-size:30px;letter-spacing:8px;font-weight:bold;color:#171a21;">
              ${code}
            </div>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b645a;">
              If you did not request this reset, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px;background:#f6f3ec;font-size:11px;color:#8a8175;">
            LuxuryStay Hospitality · Clifton, Karachi
          </td>
        </tr>
      </table>
    </div>
  `
}

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

// Sends a one-time code but never reveals whether the email is registered.
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
      'If an account with that email exists, a 6-digit reset code has been sent to your registered email.'

    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
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

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your LuxuryStay password reset code',
        html: buildResetEmail(resetCode),
        text: `Your LuxuryStay password reset code is ${resetCode}. It expires in 15 minutes. If you did not request this, you can ignore this email.`,
      })
    } catch (error) {
      console.error('[auth] reset email failed:', error.message)

      await User.updateOne(
        { _id: user._id },
        { $unset: { resetCode: 1, resetCodeExpiresAt: 1 } },
      )

      // Keep the response identical for every email address to prevent enumeration.
      return res.status(200).json({ success: true, message: genericMessage })
    }

    return res.status(200).json({ success: true, message: genericMessage })
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
