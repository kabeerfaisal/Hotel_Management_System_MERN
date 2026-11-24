import mongoose from 'mongoose'

import Booking from '../models/Booking.js'
import Room from '../models/Room.js'
import ServiceRequest from '../models/ServiceRequest.js'

const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping']

const POPULATE = [
  { path: 'room', select: 'roomNumber' },
  { path: 'requestedBy', select: 'name' },
]

export async function getServiceRequests(req, res) {
  try {
    const filter = STAFF_ROLES.includes(req.user.role) ? {} : { requestedBy: req.user.id }
    const requests = await ServiceRequest.find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
    return res.status(200).json({ success: true, requests })
  } catch (error) {
    console.error('[service-requests] getAll:', error)
    return res.status(500).json({ success: false, message: 'Unable to load service requests' })
  }
}

export async function createServiceRequest(req, res) {
  try {
    const { category, room, description, priority } = req.body ?? {}

    if (!category || !room || !description) {
      return res
        .status(400)
        .json({ success: false, message: 'Category, room and description are required' })
    }

    // Guests may only request services for a room they currently occupy.
    if (req.user.role === 'guest') {
      if (!mongoose.isValidObjectId(room)) {
        return res.status(400).json({ success: false, message: 'Invalid room id' })
      }

      const hasActiveBooking = await Booking.exists({
        user: req.user.id,
        room,
        status: { $in: ['confirmed', 'checked-in'] },
      })

      if (!hasActiveBooking) {
        return res.status(403).json({
          success: false,
          message: 'You can only request services for your active booked room',
        })
      }
    }

    const request = await ServiceRequest.create({
      category,
      room,
      description,
      priority: priority ?? 'medium',
      requestedBy: req.user.id,
    })

    const populated = await request.populate(POPULATE)
    return res.status(201).json({ success: true, request: populated })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      })
    }
    console.error('[service-requests] create:', error)
    return res.status(500).json({ success: false, message: 'Unable to create service request' })
  }
}

export async function updateServiceRequest(req, res) {
  try {
    if (!STAFF_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const { status, priority, charge } = req.body ?? {}
    const allowed = {}
    if (status !== undefined) allowed.status = status
    if (priority !== undefined) allowed.priority = priority
    if (charge !== undefined) allowed.charge = charge

    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, allowed, {
      new: true,
      runValidators: true,
    }).populate(POPULATE)

    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' })
    }

    // Auto-restore room to 'available' when a housekeeping task is completed
    if (request.category === 'housekeeping' && request.status === 'completed') {
      await Room.findOneAndUpdate(
        { _id: request.room._id ?? request.room, status: 'cleaning' },
        { status: 'available' },
      )
    }

    return res.status(200).json({ success: true, request })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      })
    }
    console.error('[service-requests] update:', error)
    return res.status(500).json({ success: false, message: 'Unable to update service request' })
  }
}
