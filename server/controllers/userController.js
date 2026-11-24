import bcrypt from 'bcryptjs'

import User, { USER_ROLES } from '../models/User.js'

const SALT_ROUNDS = 12

export async function getUsers(req, res) {
  try {
    const filter = {}
    if (req.query.role && USER_ROLES.includes(req.query.role)) {
      filter.role = req.query.role
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 })

    return res.status(200).json({ success: true, users })
  } catch (error) {
    console.error('[users] getUsers:', error)
    return res.status(500).json({ success: false, message: 'Unable to load users' })
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role, phone, preferences } = req.body ?? {}

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, email and password are required' })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const exists = await User.exists({ email: normalizedEmail })
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: 'An account with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS)

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role ?? 'guest',
      phone: phone ?? '',
      preferences: preferences ?? '',
    })

    const { password: _pw, ...safeUser } = user.toObject()
    return res.status(201).json({ success: true, user: safeUser })
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: 'An account with this email already exists' })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      })
    }
    console.error('[users] createUser:', error)
    return res.status(500).json({ success: false, message: 'Unable to create user' })
  }
}

export async function updateUser(req, res) {
  try {
    const { name, role, phone, preferences, isActive } = req.body ?? {}

    const allowed = {}
    if (name !== undefined) allowed.name = name
    if (role !== undefined) allowed.role = role
    if (phone !== undefined) allowed.phone = phone
    if (preferences !== undefined) allowed.preferences = preferences
    if (isActive !== undefined) allowed.isActive = isActive

    const user = await User.findByIdAndUpdate(req.params.id, allowed, {
      new: true,
      runValidators: true,
    }).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    return res.status(200).json({ success: true, user })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      })
    }
    console.error('[users] updateUser:', error)
    return res.status(500).json({ success: false, message: 'Unable to update user' })
  }
}

export async function toggleUserStatus(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: 'You cannot deactivate your own account' })
    }

    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.isActive = !user.isActive
    await user.save()

    return res.status(200).json({ success: true, user })
  } catch (error) {
    console.error('[users] toggleUserStatus:', error)
    return res.status(500).json({ success: false, message: 'Unable to toggle user status' })
  }
}
